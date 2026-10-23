import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicNotation, AlgebraicScalar, AlgebraicUnit, ExactCoefficientArithmetic,
    PolygonAreaAssembly, PolygonAreaBoundary, PolygonAreaContext, PolygonAreaDissectionProblem,
    PolygonAreaIsometry, PolygonAreaLengthMeasure, PolygonAreaPlacement, PolygonAreaPoint,
    PolygonAreaSegment, PolygonAreaShapeFacts, PolygonAreaSum, PolygonAreaTriangle} from '../../types/problems.ts';
import {affineCoefficientArithmetic, affineScalar, equalAffineScalars} from '../algebra/algebra-affine-helpers.ts';
import {isAlgebraicUnitRelation} from '../algebra/algebra-context-helpers.ts';
import {isCoordinateNotation} from '../coordinate/coordinate-helpers.ts';
import {coordinateOrientation} from '../coordinate/polygon-geometry-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import {buildPolygonAreaCuts, buildPolygonAreaShapeFacts, exactPolygonArea, isExactTrianglePartition,
    isPolygonAreaIsometry, isPolygonAreaSegmentLength, projectPolygonAreaHeight,
    transformPolygonAreaPoint} from './polygon-area-geometry-helpers.ts';

export type PolygonAreaLengthInput = Readonly<{measureId: string; segment: PolygonAreaSegment}> & (
    | Readonly<{kind: 'measured-length'; value: AlgebraicScalar; notation: AlgebraicNotation}>
    | Readonly<{kind: 'sum-or-difference'; operation: 'addition' | 'subtraction'; firstMeasureId: string;
        secondMeasureId: string; notation?: AlgebraicNotation}>
    | Readonly<{kind: 'scaled-length'; sourceMeasureId: string; factor: AlgebraicScalar; notation?: AlgebraicNotation}>
);
export type PolygonAreaTriangleInput = Readonly<{cellId: string; vertices: readonly [string, string, string];
    base: Readonly<{firstId: string; secondId: string; measureId: string}>;
    height: Readonly<{apexId: string; footId: string; measureId: string}>}>;
export type PolygonAreaPlacementInput = Readonly<{placementId: string; sourceCellId: string; copyIndex: number;
    transform: PolygonAreaIsometry; pointMap: readonly Readonly<{sourceId: string; targetId: string}>[]}>;
export type PolygonAreaBuildInput = Readonly<{
    source: Readonly<{regionId: string; points: readonly [PolygonAreaPoint, ...PolygonAreaPoint[]];
        boundary: PolygonAreaBoundary; cells: readonly [PolygonAreaTriangleInput, PolygonAreaTriangleInput, ...PolygonAreaTriangleInput[]]}>;
    units: Readonly<{length: AlgebraicUnit; area: AlgebraicUnit}>;
    measures: readonly [PolygonAreaLengthInput, ...PolygonAreaLengthInput[]];
    assembly: Readonly<{copyCount: number; targetBoundary: PolygonAreaBoundary;
        placements: readonly [PolygonAreaPlacementInput, PolygonAreaPlacementInput, ...PolygonAreaPlacementInput[]];
        areaDerivation: Readonly<{kind: 'rectangle-product'; firstMeasureId: string; secondMeasureId: string}>
            | Readonly<{kind: 'triangle-area-sum'}>}>;
    context: PolygonAreaContext;
}>;

const fail = (message: string): never => {throw new GeneratorValidationError('polygon-area-dissection', message);};
const require: (condition: unknown, message?: string) => asserts condition = (condition, message = 'Inconsistent polygon-area evidence.') => {if (!condition) fail(message);};
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim() === value && value.length > 0;
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
const dense = (value: unknown, minimum = 0): value is unknown[] => {
    if (!Array.isArray(value) || value.length < minimum) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
};
const scalar = (value: unknown): value is AlgebraicScalar => isCanonicalSignedRational(value);
const nonnegative = (value: unknown): value is AlgebraicScalar => scalar(value) && value.numerator >= 0;
const positive = (value: unknown): value is AlgebraicScalar => scalar(value) && value.numerator > 0;
const q = (n: number) => affineScalar(BigInt(n), 1n);
const same = equalAffineScalars;
const key = (point: Pick<PolygonAreaPoint, 'x' | 'y'>) => `${point.x.numerator}/${point.x.denominator},${point.y.numerator}/${point.y.denominator}`;
const samePoint = (first: Pick<PolygonAreaPoint, 'x' | 'y'>, second: Pick<PolygonAreaPoint, 'x' | 'y'>) => same(first.x, second.x) && same(first.y, second.y);
const tuple = (value: unknown, count: number): value is unknown[] => dense(value) && value.length === count;
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const equalSets = (first: readonly string[], second: readonly string[]) => unique(first) && unique(second)
    && first.length === second.length && first.every(value => second.includes(value));
const oneOrMore = <T>(rows: readonly T[]): readonly [T, ...T[]] => {
    const [first, ...rest] = rows; require(first !== undefined, 'A nonempty mathematical list is required.'); return [first, ...rest];
};
const twoOrMore = <T>(rows: readonly T[]): readonly [T, T, ...T[]] => {
    const [first, second, ...rest] = rows; require(first !== undefined && second !== undefined, 'At least two triangles are required.'); return [first, second, ...rest];
};
type Registry = Map<string, PolygonAreaPoint>;
const point = (points: Registry, id: unknown): PolygonAreaPoint => {
    require(text(id) && points.has(id), 'A point reference is missing.'); return points.get(id)!;
};
const segmentKey = (points: Registry, segment: PolygonAreaSegment) => [key(point(points, segment.fromId)), key(point(points, segment.toId))].sort().join('|');
const sameSegment = (points: Registry, segment: PolygonAreaSegment, first: string, second: string) =>
    segmentKey(points, segment) === segmentKey(points, {fromId: first, toId: second});
function readPoints(value: unknown): Registry {
    require(dense(value, 1), 'Exact points are required.');
    const result: Registry = new Map();
    for (const entry of value) {
        require(record(entry) && text(entry.id) && scalar(entry.x) && scalar(entry.y) && !result.has(entry.id), 'Point IDs/coordinates must be exact and unique.');
        result.set(entry.id, {id: entry.id, x: {...entry.x}, y: {...entry.y}});
    }
    return result;
}
function register(points: Registry, id: string, value: Pick<PolygonAreaPoint, 'x' | 'y'>): void {
    require(text(id) && scalar(value.x) && scalar(value.y));
    const previous = points.get(id);
    require(!previous || samePoint(previous, value), 'One point ID cannot have different positions.');
    if (!previous) points.set(id, {id, x: {...value.x}, y: {...value.y}});
}
function boundary(value: unknown, points: Registry): PolygonAreaBoundary {
    require(dense(value, 3) && value.every(text) && unique(value), 'A cyclic boundary needs unique point IDs.');
    for (const id of value) point(points, id);
    const [first, second, third, ...rest] = value;
    return [first!, second!, third!, ...rest];
}
function readSegment(value: unknown, points: Registry): PolygonAreaSegment {
    require(record(value) && text(value.fromId) && text(value.toId));
    point(points, value.fromId); point(points, value.toId);
    return {fromId: value.fromId, toId: value.toId};
}
function units(value: unknown): asserts value is PolygonAreaBuildInput['units'] {
    require(record(value) && record(value.length) && record(value.area));
    const length = value.length, area = value.area;
    require(length.subject === 'length' && area.subject === 'area' && record(length.dimensions) && record(area.dimensions));
    const lengthDimensions = length.dimensions, areaDimensions = area.dimensions;
    require(['currency', 'time', 'count'].every(axis => lengthDimensions[axis] === 0 && areaDimensions[axis] === 0)
        && lengthDimensions.length === 1 && areaDimensions.length === 2
        && isAlgebraicUnitRelation(length, length, area, 'multiplication'), 'Length and named square-area units must agree.');
}
function arithmetic(value: unknown, operation: ExactCoefficientArithmetic['operation'], first: AlgebraicScalar,
    second: AlgebraicScalar, result?: AlgebraicScalar, commutative = false): AlgebraicScalar {
    require(record(value) && value.kind === 'binary' && value.operation === operation && tuple(value.operands, 2)
        && value.operands.every(scalar) && scalar(value.result), 'Exact arithmetic evidence is required.');
    const [left, right] = value.operands;
    require(same(left!, first) && same(right!, second) || commutative && same(left!, second) && same(right!, first), 'Arithmetic operands do not resolve.');
    const computed = affineCoefficientArithmetic(operation, left!, right!).result;
    require(same(value.result, computed) && (!result || same(result, computed)), 'Arithmetic result is incorrect.');
    return computed;
}
const spelling = (value: AlgebraicScalar): AlgebraicNotation => value.denominator === 1
    ? {kind: 'integer', numeral: String(value.numerator)} : {kind: 'fraction', ...value};
const references = (measure: PolygonAreaLengthMeasure): readonly string[] => measure.kind === 'measured-length' ? []
    : measure.kind === 'scaled-length' ? [measure.sourceMeasureId] : [measure.firstMeasureId, measure.secondMeasureId];

/** A topological ID resolver accepts any coherent order, without recursive graph traversal. */
function measures(value: unknown, points: Registry, construct: boolean): Map<string, PolygonAreaLengthMeasure> {
    require(dense(value, 1), 'A nonempty length graph is required.');
    const pending = new Map<string, Record<string, unknown>>(), result = new Map<string, PolygonAreaLengthMeasure>();
    for (const entry of value) {
        require(record(entry) && text(entry.measureId) && !pending.has(entry.measureId));
        readSegment(entry.segment, points);
        require(['measured-length', 'sum-or-difference', 'scaled-length'].includes(entry.kind as string));
        if (entry.kind === 'scaled-length') require(text(entry.sourceMeasureId) && nonnegative(entry.factor));
        if (entry.kind === 'sum-or-difference') require(text(entry.firstMeasureId) && text(entry.secondMeasureId)
            && (!construct || entry.operation === 'addition' || entry.operation === 'subtraction'));
        pending.set(entry.measureId, entry);
    }
    while (pending.size) {
        let progressed = false;
        for (const [id, entry] of pending) {
            const dependencies = entry.kind === 'measured-length' ? [] : entry.kind === 'scaled-length'
                ? [entry.sourceMeasureId as string] : [entry.firstMeasureId as string, entry.secondMeasureId as string];
            if (!dependencies.every(dependency => result.has(dependency))) continue;
            let calculation: ExactCoefficientArithmetic | undefined, length: AlgebraicScalar;
            if (entry.kind === 'measured-length') {require(nonnegative(entry.value)); length = entry.value;}
            else {
                const first = result.get(dependencies[0]!)!.value;
                const second = entry.kind === 'scaled-length' ? entry.factor as AlgebraicScalar : result.get(dependencies[1]!)!.value;
                const operation = entry.kind === 'scaled-length' ? 'multiplication' : construct ? entry.operation
                    : record(entry.arithmetic) ? entry.arithmetic.operation : null;
                require(operation === 'multiplication' && entry.kind === 'scaled-length'
                    || entry.kind === 'sum-or-difference' && (operation === 'addition' || operation === 'subtraction'));
                calculation = affineCoefficientArithmetic(operation, first, second);
                length = calculation.result;
                if (!construct) arithmetic(entry.arithmetic, operation, first, second, length, operation !== 'subtraction');
            }
            require(nonnegative(length), 'Lengths/factors cannot be negative.');
            if (!construct) require(scalar(entry.value) && same(entry.value, length));
            const notation = construct && entry.notation === undefined ? spelling(length) : entry.notation;
            require(isCoordinateNotation(length, notation), 'Length notation must retain its exact value.');
            const segment = readSegment(entry.segment, points);
            require(isPolygonAreaSegmentLength(point(points, segment.fromId), point(points, segment.toId), length),
                'A measured length does not match its segment.');
            const common = {measureId: id, segment, value: {...length}, notation: {...notation}};
            const output: PolygonAreaLengthMeasure = entry.kind === 'measured-length' ? {...common, kind: 'measured-length'}
                : entry.kind === 'scaled-length' ? {...common, kind: 'scaled-length', sourceMeasureId: entry.sourceMeasureId as string,
                    factor: {...entry.factor as AlgebraicScalar}, arithmetic: construct ? calculation! : entry.arithmetic as ExactCoefficientArithmetic}
                    : {...common, kind: 'sum-or-difference', firstMeasureId: entry.firstMeasureId as string,
                        secondMeasureId: entry.secondMeasureId as string, arithmetic: construct ? calculation! : entry.arithmetic as ExactCoefficientArithmetic};
            result.set(id, output); pending.delete(id); progressed = true;
        }
        require(progressed, 'Length references contain a cycle or missing dependency.');
    }
    return result;
}
function measureAt(values: Map<string, PolygonAreaLengthMeasure>, id: unknown): PolygonAreaLengthMeasure {
    require(text(id) && values.has(id), 'A length reference is missing.'); return values.get(id)!;
}
function cellRoles(value: unknown, points: Registry): PolygonAreaTriangleInput {
    require(record(value) && text(value.cellId) && tuple(value.vertices, 3) && value.vertices.every(text) && unique(value.vertices)
        && record(value.base) && record(value.height));
    const {base, height} = value;
    require(text(base.firstId) && text(base.secondId) && base.firstId !== base.secondId && text(base.measureId)
        && text(height.apexId) && text(height.footId) && text(height.measureId)
        && equalSets(value.vertices, [base.firstId, base.secondId, height.apexId]), 'Triangle base/apex roles are inconsistent.');
    for (const id of value.vertices) point(points, id);
    return {cellId: value.cellId, vertices: [value.vertices[0]!, value.vertices[1]!, value.vertices[2]!],
        base: {firstId: base.firstId, secondId: base.secondId, measureId: base.measureId},
        height: {apexId: height.apexId, footId: height.footId, measureId: height.measureId}};
}
function cell(value: unknown, points: Registry, lengths: Map<string, PolygonAreaLengthMeasure>, construct: boolean): PolygonAreaTriangle {
    const roles = cellRoles(value, points), projection = projectPolygonAreaHeight(point(points, roles.height.apexId),
        point(points, roles.base.firstId), point(points, roles.base.secondId));
    require(samePoint(point(points, roles.height.footId), projection.foot));
    const base = measureAt(lengths, roles.base.measureId), height = measureAt(lengths, roles.height.measureId);
    require(positive(base.value) && positive(height.value)
        && sameSegment(points, base.segment, roles.base.firstId, roles.base.secondId)
        && sameSegment(points, height.segment, roles.height.apexId, roles.height.footId));
    const product = affineCoefficientArithmetic('multiplication', base.value, height.value);
    const half = affineCoefficientArithmetic('division', product.result, q(2));
    require(same(half.result, projection.area), 'Triangle area must equal its perpendicular base/height formula.');
    if (!construct) {
        require(record(value) && record(value.height) && value.height.footLocation === projection.footLocation && positive(value.area));
        arithmetic(value.baseHeightProduct, 'multiplication', base.value, height.value, product.result, true);
        arithmetic(value.halfProduct, 'division', product.result, q(2), value.area);
        require(same(value.area, projection.area));
        return {...roles, height: {...roles.height, footLocation: projection.footLocation},
            baseHeightProduct: value.baseHeightProduct as ExactCoefficientArithmetic,
            halfProduct: value.halfProduct as ExactCoefficientArithmetic, area: value.area};
    }
    return {...roles, height: {...roles.height, footLocation: projection.footLocation}, baseHeightProduct: product, halfProduct: half, area: half.result};
}
function areaSum(value: unknown, areas: Map<string, AlgebraicScalar>, expected: AlgebraicScalar): void {
    require(record(value) && dense(value.pieceIds, 1) && value.pieceIds.every(text)
        && equalSets(value.pieceIds, [...areas.keys()]) && dense(value.additions) && value.additions.length === areas.size - 1 && scalar(value.total));
    let total = areas.get(value.pieceIds[0]!)!;
    for (let index = 1; index < value.pieceIds.length; index++) total = arithmetic(value.additions[index - 1], 'addition', total, areas.get(value.pieceIds[index]!)!, undefined, true);
    require(same(total, value.total) && same(total, expected), 'The complete area sum is incorrect.');
}
function makeSum(areas: Map<string, AlgebraicScalar>): PolygonAreaSum {
    const pieceIds = oneOrMore([...areas.keys()]), additions: ExactCoefficientArithmetic[] = [];
    let total = areas.get(pieceIds[0])!;
    for (const id of pieceIds.slice(1)) {const step = affineCoefficientArithmetic('addition', total, areas.get(id)!); additions.push(step); total = step.result;}
    return {pieceIds, additions, total};
}
function shapeFacts(value: unknown, expected: PolygonAreaShapeFacts): void {
    require(record(value) && value.orientation === expected.orientation && dense(value.sides) && value.sides.length === expected.sides.length
        && dense(value.angles) && value.angles.length === expected.angles.length && dense(value.parallelEdgePairs) && dense(value.equalLengthEdgeGroups));
    value.sides.forEach((entry, index) => {
        const wanted = expected.sides[index]!;
        require(record(entry) && integer(entry.edgeIndex) && entry.edgeIndex === wanted.edgeIndex && entry.fromId === wanted.fromId && entry.toId === wanted.toId
            && scalar(entry.squaredLength) && same(entry.squaredLength, wanted.squaredLength));
    });
    value.angles.forEach((entry, index) => {
        const wanted = expected.angles[index]!;
        require(record(entry) && entry.vertexId === wanted.vertexId && entry.previousId === wanted.previousId && entry.nextId === wanted.nextId
            && entry.kind === wanted.kind && scalar(entry.dotProduct) && scalar(entry.crossProduct)
            && same(entry.dotProduct, wanted.dotProduct) && same(entry.crossProduct, wanted.crossProduct));
    });
    const pairKey = (entry: unknown) => {
        require(record(entry) && integer(entry.firstEdgeIndex) && integer(entry.secondEdgeIndex)
            && entry.firstEdgeIndex >= 0 && entry.secondEdgeIndex >= 0 && entry.firstEdgeIndex < expected.sides.length
            && entry.secondEdgeIndex < expected.sides.length && entry.firstEdgeIndex !== entry.secondEdgeIndex);
        return [entry.firstEdgeIndex, entry.secondEdgeIndex].sort((a, b) => a - b).join(',');
    };
    require(equalSets(value.parallelEdgePairs.map(pairKey), expected.parallelEdgePairs.map(pairKey)));
    const groupKey = (entry: unknown) => {
        require(dense(entry, 2) && entry.every(index => integer(index) && index >= 0 && index < expected.sides.length));
        require(new Set(entry).size === entry.length); return [...entry].sort((a, b) => (a as number) - (b as number)).join(',');
    };
    require(equalSets(value.equalLengthEdgeGroups.map(groupKey), expected.equalLengthEdgeGroups.map(groupKey)));
}
function cuts(value: unknown, expected: readonly ReturnType<typeof buildPolygonAreaCuts>[number][], points: Registry, cellIds: readonly string[]): void {
    require(dense(value, 1));
    const ids: string[] = [];
    const cutKey = (entry: unknown): string => {
        require(record(entry) && text(entry.cutId) && tuple(entry.adjacentCellIds, 2) && entry.adjacentCellIds.every(text)
            && unique(entry.adjacentCellIds) && entry.adjacentCellIds.every(id => cellIds.includes(id)));
        ids.push(entry.cutId);
        return JSON.stringify([segmentKey(points, readSegment(entry, points)), [...entry.adjacentCellIds].sort()]);
    };
    const actual = value.map(cutKey); require(unique(ids)); ids.length = 0;
    require(equalSets(actual, expected.map(cutKey)), 'Cuts must be the complete internal atomic arrangement.');
}
function placement(value: unknown, points: Registry, cells: Map<string, PolygonAreaTriangle>, copyCount: number, construct: boolean): PolygonAreaPlacement {
    require(record(value) && text(value.placementId) && text(value.sourceCellId) && cells.has(value.sourceCellId)
        && integer(value.copyIndex) && value.copyIndex >= 0 && value.copyIndex < copyCount && isPolygonAreaIsometry(value.transform)
        && dense(value.pointMap));
    const source = cells.get(value.sourceCellId)!, required = [...new Set([...source.vertices, source.height.footId])];
    const map = new Map<string, string>();
    for (const entry of value.pointMap) {
        require(record(entry) && text(entry.sourceId) && text(entry.targetId) && !map.has(entry.sourceId));
        const transformed = transformPolygonAreaPoint(point(points, entry.sourceId), value.transform);
        if (construct) register(points, entry.targetId, transformed);
        else require(samePoint(point(points, entry.targetId), transformed));
        map.set(entry.sourceId, entry.targetId);
    }
    require(equalSets([...map.keys()], required), 'A placement must map every cell vertex and its foot exactly once.');
    const vertices: PolygonAreaTriangle['vertices'] = [map.get(source.vertices[0])!, map.get(source.vertices[1])!, map.get(source.vertices[2])!];
    const heightFootId = map.get(source.height.footId)!;
    if (!construct) require(tuple(value.vertices, 3) && value.vertices.every(text) && equalSets(value.vertices, vertices)
        && value.heightFootId === heightFootId && positive(value.area) && same(value.area, source.area));
    require(same(exactPolygonArea(vertices.map(id => point(points, id))), source.area));
    return {placementId: value.placementId, sourceCellId: value.sourceCellId, copyIndex: value.copyIndex,
        transform: value.transform, pointMap: [...map].map(([sourceId, targetId]) => ({sourceId, targetId})), vertices, heightFootId, area: source.area};
}
function placementCount(value: unknown, cellCount: number): {copyCount: number; entries: unknown[]} {
    require(record(value) && integer(value.copyCount) && value.copyCount > 0 && Number.isSafeInteger(value.copyCount * cellCount)
        && Array.isArray(value.placements) && value.placements.length === value.copyCount * cellCount && dense(value.placements, 2),
    'Every cell must appear once in every source copy.');
    return {copyCount: value.copyCount, entries: value.placements};
}
const rawDifference = (a: AlgebraicScalar, b: AlgebraicScalar) => ({n: BigInt(a.numerator) * BigInt(b.denominator) - BigInt(b.numerator) * BigInt(a.denominator), d: BigInt(a.denominator) * BigInt(b.denominator)});
const rightAngle = (a: PolygonAreaPoint, b: PolygonAreaPoint, c: PolygonAreaPoint) => {
    const x1 = rawDifference(a.x, b.x), x2 = rawDifference(c.x, b.x), y1 = rawDifference(a.y, b.y), y2 = rawDifference(c.y, b.y);
    return x1.n * x2.n * y1.d * y2.d + y1.n * y2.n * x1.d * x2.d === 0n;
};
function rectangle(value: unknown, target: PolygonAreaBoundary, points: Registry, lengths: Map<string, PolygonAreaLengthMeasure>, area: AlgebraicScalar): void {
    require(record(value));
    if (value.kind === 'triangle-area-sum') return;
    require(value.kind === 'rectangle-product');
    const corners = target.filter((id, index) => coordinateOrientation(point(points, target[(index + target.length - 1) % target.length]),
        point(points, id), point(points, target[(index + 1) % target.length])) !== 0);
    require(corners.length === 4 && corners.every((id, index) => rightAngle(point(points, corners[(index + 3) % 4]), point(points, id), point(points, corners[(index + 1) % 4]))), 'The target product requires an actual rectangle.');
    const first = measureAt(lengths, value.firstMeasureId), second = measureAt(lengths, value.secondMeasureId);
    require(first.kind !== 'measured-length' && second.kind !== 'measured-length' && positive(first.value) && positive(second.value), 'Target edge lengths must be source-derived.');
    const edge = (measure: PolygonAreaLengthMeasure) => corners.findIndex((id, index) => sameSegment(points, measure.segment, id, corners[(index + 1) % 4]!));
    const a = edge(first), b = edge(second);
    require(a >= 0 && b >= 0 && (Math.abs(a - b) === 1 || Math.abs(a - b) === 3), 'Target dimensions must be adjacent complete rectangle edges.');
    arithmetic(value.product, 'multiplication', first.value, second.value, area, true);
}
function context(value: unknown, source: {regionId: string; boundary: PolygonAreaBoundary; cells: readonly PolygonAreaTriangle[]},
    points: Registry, lengths: Map<string, PolygonAreaLengthMeasure>): void {
    require(record(value) && ['floor-region', 'garden-bed', 'fabric-panel'].includes(value.kind as string)
        && value.sourceRegionId === source.regionId && dense(value.dimensions, 1));
    const closure = new Set<string>(), pending = source.cells.flatMap(entry => [entry.base.measureId, entry.height.measureId]);
    while (pending.length) {const id = pending.pop()!; if (!closure.has(id)) {closure.add(id); pending.push(...references(measureAt(lengths, id)));}}
    const sourceIds = [...source.boundary, ...source.cells.flatMap(entry => [...entry.vertices, entry.height.footId])];
    const sourcePositions = new Set(sourceIds.map(id => key(point(points, id))));
    for (const measure of lengths.values()) {
        if (measure.kind === 'measured-length') require(closure.has(measure.measureId), 'Every primitive must ground a source-cell measurement.');
        if (closure.has(measure.measureId)) require(sourcePositions.has(key(point(points, measure.segment.fromId)))
            && sourcePositions.has(key(point(points, measure.segment.toId))), 'A source calculation cannot depend on target-only geometry.');
    }
    const dimensionIds: string[] = [];
    for (const dimension of value.dimensions) {
        require(record(dimension) && text(dimension.measureId) && closure.has(dimension.measureId)); dimensionIds.push(dimension.measureId);
        const measure = measureAt(lengths, dimension.measureId), segment = measure.segment;
        if (dimension.meaning === 'base-span') require(source.cells.some(entry => sameSegment(points, segment, entry.base.firstId, entry.base.secondId))
            || source.boundary.some((id, index) => sameSegment(points, segment, id, source.boundary[(index + 1) % source.boundary.length]!)));
        else if (dimension.meaning === 'perpendicular-height') require(source.cells.some(entry => sameSegment(points, segment, entry.height.apexId, entry.height.footId)));
        else if (dimension.meaning === 'diagonal-span') require(source.boundary.some((id, i) => source.boundary.some((other, j) =>
            Math.abs(i - j) > 1 && Math.abs(i - j) < source.boundary.length - 1 && sameSegment(points, segment, id, other))));
        else require(dimension.meaning === 'offset-span');
    }
    require(equalSets(dimensionIds, [...closure]), 'Context must supply exactly the source length dependency closure.');
}

/** Validate complete independent witnesses, never equality against a builder serialization. */
export function isPolygonAreaDissectionProblem(value: unknown): value is PolygonAreaDissectionProblem {
    try {
        require(record(value) && value.kind === 'polygon-area-dissection' && record(value.source) && record(value.assembly));
        units(value.units);
        const points = readPoints(value.points), source = value.source, assembly = value.assembly;
        require(text(source.regionId) && dense(source.cells, 2));
        const sourceBoundary = boundary(source.boundary, points), lengths = measures(value.measures, points, false);
        const cells = source.cells.map(entry => cell(entry, points, lengths, false));
        require(unique(cells.map(entry => entry.cellId)) && isExactTrianglePartition([...points.values()], sourceBoundary, cells));
        const area = exactPolygonArea(sourceBoundary.map(id => point(points, id)));
        require(positive(source.area) && same(source.area, area));
        shapeFacts(source.shapeFacts, buildPolygonAreaShapeFacts([...points.values()], sourceBoundary));
        cuts(source.cuts, buildPolygonAreaCuts([...points.values()], sourceBoundary, cells), points, cells.map(entry => entry.cellId));
        areaSum(source.areaSum, new Map(cells.map(entry => [entry.cellId, entry.area])), area);
        const {copyCount, entries} = placementCount(assembly, cells.length), cellMap = new Map(cells.map(entry => [entry.cellId, entry]));
        const placements = entries.map(entry => placement(entry, points, cellMap, copyCount, false));
        require(unique(placements.map(entry => entry.placementId)) && unique(placements.map(entry => `${entry.sourceCellId}:${entry.copyIndex}`)));
        const target = boundary(assembly.targetBoundary, points);
        require(isExactTrianglePartition([...points.values()], target, placements.map(entry => ({cellId: entry.placementId, vertices: entry.vertices}))));
        const targetArea = exactPolygonArea(target.map(id => point(points, id)));
        areaSum(assembly.areaSum, new Map(placements.map(entry => [entry.placementId, entry.area])), targetArea);
        arithmetic(assembly.copyAreaProduct, 'multiplication', area, q(copyCount), targetArea, true);
        arithmetic(assembly.sourceAreaNormalization, 'division', targetArea, q(copyCount), area);
        rectangle(assembly.areaDerivation, target, points, lengths, targetArea);
        context(value.context, {boundary: sourceBoundary, cells, regionId: source.regionId}, points, lengths);
        return true;
    } catch {return false;}
}

/** Derive source feet, then rigid target points, then the complete length/work graph. */
export function buildPolygonAreaDissectionProblem(input: PolygonAreaBuildInput): PolygonAreaDissectionProblem {
    try {
        require(record(input) && record(input.source) && record(input.assembly) && text(input.source.regionId)); units(input.units);
        const points = readPoints(input.source.points), sourceBoundary = boundary(input.source.boundary, points);
        require(dense(input.source.cells, 2));
        const roles = input.source.cells.map(entry => cellRoles(entry, points)); require(unique(roles.map(entry => entry.cellId)));
        for (const entry of roles) register(points, entry.height.footId,
            projectPolygonAreaHeight(point(points, entry.height.apexId), point(points, entry.base.firstId), point(points, entry.base.secondId)).foot);
        const count = placementCount(input.assembly, roles.length), roleMap = new Map(roles.map(entry => [entry.cellId, entry]));
        for (const entry of count.entries) {
            require(record(entry) && text(entry.sourceCellId) && roleMap.has(entry.sourceCellId) && isPolygonAreaIsometry(entry.transform) && dense(entry.pointMap));
            const source = roleMap.get(entry.sourceCellId)!;
            const required = [...new Set([...source.vertices, source.height.footId])], mapped: string[] = [];
            for (const mapping of entry.pointMap) {
                require(record(mapping) && text(mapping.sourceId) && text(mapping.targetId) && required.includes(mapping.sourceId));
                mapped.push(mapping.sourceId); register(points, mapping.targetId, transformPolygonAreaPoint(point(points, mapping.sourceId), entry.transform));
            }
            require(equalSets(mapped, required));
        }
        const lengths = measures(input.measures, points, true), cells = roles.map(entry => cell(entry, points, lengths, true));
        const cellMap = new Map(cells.map(entry => [entry.cellId, entry])), placements = count.entries.map(entry => placement(entry, points, cellMap, count.copyCount, true));
        const sourceAreaSum = makeSum(new Map(cells.map(entry => [entry.cellId, entry.area])));
        const assemblyAreaSum = makeSum(new Map(placements.map(entry => [entry.placementId, entry.area])));
        const targetBoundary = boundary(input.assembly.targetBoundary, points);
        const areaDerivation = input.assembly.areaDerivation;
        require(record(areaDerivation) && (areaDerivation.kind === 'rectangle-product' || areaDerivation.kind === 'triangle-area-sum'));
        const commonAssembly: Omit<PolygonAreaAssembly, 'areaDerivation'> = {copyCount: count.copyCount, targetBoundary, placements: twoOrMore(placements), areaSum: assemblyAreaSum,
            copyAreaProduct: affineCoefficientArithmetic('multiplication', sourceAreaSum.total, q(count.copyCount)),
            sourceAreaNormalization: affineCoefficientArithmetic('division', assemblyAreaSum.total, q(count.copyCount))};
        const assembly: PolygonAreaAssembly = areaDerivation.kind === 'triangle-area-sum'
            ? {...commonAssembly, areaDerivation: {kind: 'triangle-area-sum'}}
            : {...commonAssembly, areaDerivation: {kind: 'rectangle-product', firstMeasureId: areaDerivation.firstMeasureId,
                secondMeasureId: areaDerivation.secondMeasureId, product: affineCoefficientArithmetic('multiplication',
                    measureAt(lengths, areaDerivation.firstMeasureId).value, measureAt(lengths, areaDerivation.secondMeasureId).value)}};
        require(record(input.context) && dense(input.context.dimensions, 1));
        const result: PolygonAreaDissectionProblem = {kind: 'polygon-area-dissection', points: oneOrMore([...points.values()]),
            units: {length: {...input.units.length, dimensions: {...input.units.length.dimensions}}, area: {...input.units.area, dimensions: {...input.units.area.dimensions}}},
            measures: oneOrMore(input.measures.map(entry => measureAt(lengths, entry.measureId))),
            source: {regionId: input.source.regionId, boundary: sourceBoundary, shapeFacts: buildPolygonAreaShapeFacts([...points.values()], sourceBoundary),
                cells: twoOrMore(cells), cuts: oneOrMore(buildPolygonAreaCuts([...points.values()], sourceBoundary, cells)), areaSum: sourceAreaSum, area: sourceAreaSum.total},
            assembly, context: {...input.context, dimensions: oneOrMore(input.context.dimensions.map(entry => ({...entry})))}};
        require(isPolygonAreaDissectionProblem(result), 'The complete polygon-area blueprint is inconsistent.');
        return result;
    } catch (error) {return fail(error instanceof Error ? error.message : 'Invalid polygon-area blueprint.');}
}
