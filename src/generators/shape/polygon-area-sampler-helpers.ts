/** Literal sampling blueprints. The complete model helper derives and verifies every witness. */
import {GeneratorValidationError} from '../../lib/errors.ts';
import {affineScalar, multiplyAffineScalars} from '../algebra/algebra-affine-helpers.ts';
import type {AlgebraicNotation, AlgebraicScalar} from '../../types/problems.ts';
import type {PolygonAreaContext, PolygonAreaIsometry} from '../../types/problems.ts';
import type {PolygonAreaBuildInput, PolygonAreaLengthInput, PolygonAreaPlacementInput, PolygonAreaTriangleInput} from './polygon-area-helpers.ts';

export type PolygonAreaSamplerFamily = 'right-triangle' | 'acute-triangle' | 'obtuse-triangle'
    | 'parallelogram' | 'rhombus' | 'trapezoid' | 'kite' | 'polygon';
export type PolygonAreaSamplerVariant = 'convex' | 'star' | 'nonstar';
export type PolygonAreaSamplerScale = 0 | 1 | 2 | 3;
type Pair = readonly [number, number];
type Cell = Readonly<{id: string; vertices: readonly [string, string, string];
    base: readonly [string, string, number]; height: readonly [string, string, number]}>;
type Literal = Readonly<{
    points: Readonly<Record<string, Pair>>;
    boundary: readonly [string, string, string, ...string[]];
    cells: readonly [Cell, Cell, ...Cell[]];
    assembly: 'identity' | 'right-doubling' | 'parallelogram-wedge';
}>;
const rational = (n: number, d = 1) => affineScalar(BigInt(n), BigInt(d));
const notation = (value: AlgebraicScalar): AlgebraicNotation => value.denominator === 1
    ? {kind: 'integer', numeral: String(value.numerator)} : {kind: 'fraction', ...value};
const cell = (id: string, vertices: Cell['vertices'], base: Cell['base'], height: Cell['height']): Cell => ({id, vertices, base, height});
const atLeastOne = <T>(rows: readonly T[]): readonly [T, ...T[]] => {
    const [first, ...rest] = rows; if (first === undefined) throw Error('Literal blueprint requires at least one row.'); return [first, ...rest];
};
const atLeastTwo = <T>(rows: readonly T[]): readonly [T, T, ...T[]] => {
    const [first, second, ...rest] = rows; if (first === undefined || second === undefined) throw Error('Literal blueprint requires at least two rows.'); return [first, second, ...rest];
};

function triangle(family: 'right-triangle' | 'acute-triangle' | 'obtuse-triangle'): Literal {
    if (family === 'right-triangle') return {
        points: {A: [0, 0], B: [4, 0], C: [0, 3], P: [2, 0]}, boundary: ['A', 'B', 'C'],
        cells: [cell('t1', ['A', 'P', 'C'], ['A', 'P', 2], ['C', 'A', 3]),
            cell('t2', ['P', 'B', 'C'], ['P', 'B', 2], ['C', 'A', 3])], assembly: 'right-doubling',
    };
    const height = family === 'acute-triangle' ? 4 : 1;
    return {points: {A: [0, 0], B: [6, 0], C: [3, height], H: [3, 0]}, boundary: ['A', 'B', 'C'],
        cells: [cell('t1', ['A', 'H', 'C'], ['A', 'H', 3], ['C', 'H', height]),
            cell('t2', ['H', 'B', 'C'], ['H', 'B', 3], ['C', 'H', height])], assembly: 'identity'};
}

function parallelogram(): Literal {
    return {points: {A: [0, 0], B: [4, 0], C: [5, 2], D: [1, 2], E: [1, 0]}, boundary: ['A', 'B', 'C', 'D'],
        cells: [cell('t1', ['A', 'E', 'D'], ['A', 'E', 1], ['D', 'E', 2]),
            cell('t2', ['E', 'B', 'C'], ['E', 'B', 3], ['C', 'F', 2]),
            cell('t3', ['E', 'C', 'D'], ['E', 'D', 2], ['C', 'D', 4])], assembly: 'parallelogram-wedge'};
}

function diamond(family: 'rhombus' | 'kite'): Literal {
    const halfWidth = family === 'rhombus' ? 3 : 2, lowerHeight = family === 'rhombus' ? 2 : 1,
        upperHeight = family === 'rhombus' ? 2 : 3;
    return {points: {A: [-halfWidth, 0], B: [0, -lowerHeight], C: [halfWidth, 0], D: [0, upperHeight], O: [0, 0]},
        boundary: ['A', 'B', 'C', 'D'],
        cells: [cell('t1', ['O', 'A', 'B'], ['O', 'A', halfWidth], ['B', 'O', lowerHeight]),
            cell('t2', ['O', 'B', 'C'], ['O', 'C', halfWidth], ['B', 'O', lowerHeight]),
            cell('t3', ['O', 'C', 'D'], ['O', 'C', halfWidth], ['D', 'O', upperHeight]),
            cell('t4', ['O', 'D', 'A'], ['O', 'A', halfWidth], ['D', 'O', upperHeight])], assembly: 'identity'};
}

function trapezoid(): Literal {
    return {points: {A: [0, 0], B: [6, 0], C: [4, 3], D: [1, 3], E: [1, 0], F: [4, 0]},
        boundary: ['A', 'B', 'C', 'D'],
        cells: [cell('t1', ['A', 'E', 'D'], ['A', 'E', 1], ['D', 'E', 3]),
            cell('t2', ['E', 'F', 'C'], ['E', 'F', 3], ['C', 'F', 3]),
            cell('t3', ['E', 'C', 'D'], ['C', 'D', 3], ['E', 'D', 3]),
            cell('t4', ['F', 'B', 'C'], ['F', 'B', 2], ['C', 'F', 3])], assembly: 'identity'};
}

function convexPolygon(): Literal {
    return {points: {A: [0, 0], B: [4, 0], C: [5, 2], D: [2, 5], E: [0, 3], L: [2, 0], M: [4, 3]},
        boundary: ['A', 'B', 'C', 'D', 'E'],
        cells: [cell('t1', ['A', 'L', 'D'], ['L', 'D', 5], ['A', 'L', 2]),
            cell('t2', ['A', 'D', 'E'], ['A', 'E', 3], ['D', 'F', 2]),
            cell('t3', ['L', 'B', 'M'], ['B', 'M', 3], ['L', 'B', 2]),
            cell('t4', ['L', 'M', 'D'], ['L', 'D', 5], ['M', 'G', 2]),
            cell('t5', ['B', 'C', 'M'], ['B', 'M', 3], ['C', 'H', 1])], assembly: 'identity'};
}

function starPolygon(): Literal {
    return {points: {A: [-4, 0], B: [-1, -1], C: [0, -4], D: [1, -1], E: [4, 0], F: [1, 1], G: [0, 4], H: [-1, 1], O: [0, 0]},
        boundary: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        cells: [cell('t1', ['O', 'A', 'B'], ['O', 'A', 4], ['B', 'foot-left', 1]),
            cell('t2', ['O', 'B', 'C'], ['O', 'C', 4], ['B', 'foot-bottom', 1]),
            cell('t3', ['O', 'C', 'D'], ['O', 'C', 4], ['D', 'foot-bottom', 1]),
            cell('t4', ['O', 'D', 'E'], ['O', 'E', 4], ['D', 'foot-right', 1]),
            cell('t5', ['O', 'E', 'F'], ['O', 'E', 4], ['F', 'foot-right', 1]),
            cell('t6', ['O', 'F', 'G'], ['O', 'G', 4], ['F', 'foot-top', 1]),
            cell('t7', ['O', 'G', 'H'], ['O', 'G', 4], ['H', 'foot-top', 1]),
            cell('t8', ['O', 'H', 'A'], ['O', 'A', 4], ['H', 'foot-left', 1])], assembly: 'identity'};
}

function nonstarPolygon(): Literal {
    return {points: {A: [0, 0], B: [6, 0], C: [6, 5], D: [4, 5], E: [4, 2], F: [2, 2], G: [2, 5], H: [0, 4], L: [2, 0], M: [4, 0]},
        boundary: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        cells: [cell('t1', ['A', 'L', 'G'], ['L', 'G', 5], ['A', 'L', 2]),
            cell('t2', ['A', 'G', 'H'], ['A', 'H', 4], ['G', 'upper-left-foot', 2]),
            cell('t3', ['L', 'M', 'E'], ['M', 'E', 2], ['L', 'M', 2]),
            cell('t4', ['L', 'E', 'F'], ['L', 'F', 2], ['E', 'F', 2]),
            cell('t5', ['M', 'B', 'C'], ['B', 'C', 5], ['M', 'B', 2]),
            cell('t6', ['M', 'C', 'D'], ['M', 'D', 5], ['C', 'D', 2])], assembly: 'identity'};
}

function literal(family: PolygonAreaSamplerFamily, variant: PolygonAreaSamplerVariant): Literal {
    switch (family) {
        case 'right-triangle': case 'acute-triangle': case 'obtuse-triangle': return triangle(family);
        case 'parallelogram': return parallelogram();
        case 'rhombus': case 'kite': return diamond(family);
        case 'trapezoid': return trapezoid();
        case 'polygon': return variant === 'convex' ? convexPolygon() : variant === 'star' ? starPolygon() : nonstarPolygon();
    }
}

/** The root sampler chooses these actual mathematical inputs with its seeded PRNG.
 * This constructor itself draws no random values, checks no ontology labels and computes no geometry.
 * Fractions occur in GIVEN source measurements under scales1/2 and3/2, not only in hidden areas.
 */
export function makePolygonAreaSamplerBlueprint(
    family: PolygonAreaSamplerFamily,
    scaleIndex: PolygonAreaSamplerScale,
    contextKind: PolygonAreaContext['kind'],
    polygonVariant: PolygonAreaSamplerVariant,
): PolygonAreaBuildInput {
    if (!['right-triangle', 'acute-triangle', 'obtuse-triangle', 'parallelogram', 'rhombus', 'trapezoid', 'kite', 'polygon'].includes(family)
        || !['floor-region', 'garden-bed', 'fabric-panel'].includes(contextKind)
        || !['convex', 'star', 'nonstar'].includes(polygonVariant)) {
        throw new GeneratorValidationError('polygon-area-dissection', 'The sampler needs a supported literal family, context and polygon variant.');
    }
    const scales = [rational(1, 2), rational(1), rational(3, 2), rational(2)] as const;
    const scale = scales[scaleIndex];
    if (!scale) throw new GeneratorValidationError('polygon-area-dissection', 'Unknown literal sampler scale.');
    const template = literal(family, polygonVariant), scaled = (n: number) => multiplyAffineScalars(rational(n), scale);
    const measures: PolygonAreaLengthInput[] = [], dimensions: PolygonAreaContext['dimensions'][number][] = [];
    const sourceSegments = new Map<string, {id: string; literalLength: number}>();
    const sourceMeasure = (first: string, second: string, length: number, meaning: 'base-span' | 'perpendicular-height') => {
        const key = JSON.stringify([first, second].sort()), existing = sourceSegments.get(key);
        if (existing) {if (existing.literalLength !== length) throw Error('Inconsistent literal source segment.'); return existing.id;}
        const measureId = `source-length-${sourceSegments.size + 1}`, value = scaled(length);
        sourceSegments.set(key, {id: measureId, literalLength: length});
        measures.push({kind: 'measured-length', measureId, segment: {fromId: first, toId: second}, value, notation: notation(value)});
        dimensions.push({measureId, meaning}); return measureId;
    };
    const cells = template.cells.map(entry => ({cellId: entry.id, vertices: entry.vertices,
        base: {firstId: entry.base[0], secondId: entry.base[1], measureId: sourceMeasure(...entry.base, 'base-span')},
        height: {apexId: entry.height[0], footId: entry.height[1], measureId: sourceMeasure(...entry.height, 'perpendicular-height')},
    } satisfies PolygonAreaTriangleInput));
    const identity: PolygonAreaIsometry = {matrix: [[rational(1), rational(0)], [rational(0), rational(1)]], translation: {x: rational(0), y: rational(0)}};
    const placement = (entry: PolygonAreaTriangleInput, copyIndex: number, transform: PolygonAreaIsometry,
        rename: (id: string) => string): PolygonAreaPlacementInput => ({placementId: `${entry.cellId}-copy-${copyIndex}`,
        sourceCellId: entry.cellId, copyIndex, transform,
        pointMap: [...new Set([...entry.vertices, entry.height.footId])].map(sourceId => ({sourceId, targetId: rename(sourceId)}))});
    let placements = cells.map(entry => placement(entry, 0, identity, id => id));
    let targetBoundary = template.boundary;
    let copyCount = 1;
    let areaDerivation: PolygonAreaBuildInput['assembly']['areaDerivation'] = {kind: 'triangle-area-sum'};
    if (template.assembly === 'right-doubling') {
        copyCount = 2;
        const halfTurn: PolygonAreaIsometry = {matrix: [[rational(-1), rational(0)], [rational(0), rational(-1)]], translation: {x: scaled(4), y: scaled(3)}};
        const names: Readonly<Record<string, string>> = {A: 'target-top-right', B: 'C', C: 'B', P: 'target-top-middle'};
        placements = [...placements, ...cells.map(entry => placement(entry, 1, halfTurn, id => {
            const target = names[id]; if (!target) throw Error('Missing literal half-turn ID.'); return target;
        }))];
        targetBoundary = ['A', 'B', 'target-top-right', 'C'];
        const baseFirst = cells[0]!.base.measureId, baseSecond = cells[1]!.base.measureId, height = cells[0]!.height.measureId;
        measures.push({kind: 'sum-or-difference', measureId: 'target-width', segment: {fromId: 'A', toId: 'B'}, operation: 'addition', firstMeasureId: baseFirst, secondMeasureId: baseSecond},
            {kind: 'scaled-length', measureId: 'target-height', segment: {fromId: 'B', toId: 'target-top-right'}, sourceMeasureId: height, factor: rational(1)});
        areaDerivation = {kind: 'rectangle-product', firstMeasureId: 'target-width', secondMeasureId: 'target-height'};
    } else if (template.assembly === 'parallelogram-wedge') {
        const translate: PolygonAreaIsometry = {matrix: identity.matrix, translation: {x: scaled(4), y: rational(0)}};
        const names: Readonly<Record<string, string>> = {A: 'B', E: 'F', D: 'C'};
        placements = cells.map((entry, index) => index === 0 ? placement(entry, 0, translate, id => {
            const target = names[id]; if (!target) throw Error('Missing literal wedge ID.'); return target;
        }) : placement(entry, 0, identity, id => id));
        targetBoundary = ['E', 'F', 'C', 'D'];
        measures.push({kind: 'scaled-length', measureId: 'target-width', segment: {fromId: 'E', toId: 'F'}, sourceMeasureId: cells[2]!.height.measureId, factor: rational(1)},
            {kind: 'scaled-length', measureId: 'target-height', segment: {fromId: 'F', toId: 'C'}, sourceMeasureId: cells[0]!.height.measureId, factor: rational(1)});
        areaDerivation = {kind: 'rectangle-product', firstMeasureId: 'target-width', secondMeasureId: 'target-height'};
    }
    return {source: {regionId: 'original-region',
        points: atLeastOne(Object.entries(template.points).map(([id, [x, y]]) => ({id, x: scaled(x), y: scaled(y)}))),
        boundary: template.boundary, cells: atLeastTwo(cells)},
        units: {length: {subject: 'length', name: 'meters', dimensions: {currency: 0, time: 0, count: 0, length: 1}},
            area: {subject: 'area', name: 'square meters', dimensions: {currency: 0, time: 0, count: 0, length: 2}}},
        measures: atLeastOne(measures), assembly: {copyCount, targetBoundary, placements: atLeastTwo(placements), areaDerivation},
        context: {kind: contextKind, sourceRegionId: 'original-region', dimensions: atLeastOne(dimensions)}};
}
