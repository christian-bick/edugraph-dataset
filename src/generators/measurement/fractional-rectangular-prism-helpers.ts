import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicScalar, ExactCoefficientArithmetic, FractionalPrismPackingBounds,
    FractionalRectangularPrismVolumeProblem, RectangularPrismCellGroup, UnitCubeCell} from '../../types/problems.ts';
import {affineCoefficientArithmetic, affineScalar} from '../algebra/algebra-affine-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';

export type FractionalPrismRelationProfile = 'packing-count' | 'packing-equivalence'
    | 'triple-product' | 'associative-triple-product' | 'edge-formula' | 'base-area-formula';
export type FractionalRectangularPrismBuildInput = Readonly<{
    packingBounds: FractionalPrismPackingBounds;
    partitionDenominator: number;
    relationProfile: FractionalPrismRelationProfile;
}>;

const fail = (message: string): never => {throw new GeneratorValidationError('volume-rectangular-prism', message);};
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
const positiveInteger = (value: unknown): value is number => integer(value) && value > 0;
const positive = (value: unknown): value is AlgebraicScalar => isCanonicalSignedRational(value) && value.numerator > 0;
const scalar = (n: bigint, d = 1n): AlgebraicScalar => affineScalar(n, d);
const product = (first: AlgebraicScalar, second: AlgebraicScalar): ExactCoefficientArithmetic =>
    affineCoefficientArithmetic('multiplication', first, second);
const sameScalar = (value: unknown, expected: AlgebraicScalar): boolean => positive(value)
    && value.numerator === expected.numerator && value.denominator === expected.denominator;
const safeCount = (value: bigint): number => value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : fail('A stored count or denominator exceeds safe integer storage.');

/** Expected lengths precede density checks; a huge sparse array fails at its first hole. */
function array(value: unknown, length: number): value is unknown[] {
    if (!Array.isArray(value) || value.length !== length) return false;
    for (let index = 0; index < length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
}

/** No cell allocation: exact counts and reduced physical values are separate quantities. */
function measures(bounds: unknown, denominator: unknown) {
    if (!record(bounds) || !positiveInteger(bounds.columns) || !positiveInteger(bounds.rows)
        || !positiveInteger(bounds.layers) || !positiveInteger(denominator) || denominator < 2) {
        return fail('Expected positive integer packing bounds and a partition denominator at least two.');
    }
    const columns = bounds.columns, rows = bounds.rows, layers = bounds.layers;
    const C = BigInt(columns), R = BigInt(rows), H = BigInt(layers), n = BigInt(denominator);
    const cubesPerLayer = safeCount(C * R), cubeCount = safeCount(C * R * H);
    safeCount(n * n * n);
    return {columns, rows, layers, denominator, C, R, H, cubesPerLayer, cubeCount,
        c: scalar(1n, n), face: scalar(1n, n * n), cube: scalar(1n, n * n * n),
        length: scalar(C, n), width: scalar(R, n), height: scalar(H, n),
        base: scalar(C * R, n * n), volume: scalar(C * R * H, n * n * n),
        layerVolume: scalar(C * R, n * n * n), widthHeight: scalar(R * H, n * n)};
}
type Measures = ReturnType<typeof measures>;

function cellAt(index: number, m: Measures): UnitCubeCell {
    const position = BigInt(index);
    return {column: Number(position % m.C), row: Number(position / m.C % m.R), layer: Number(position / (m.C * m.R))};
}
const sameCell = (value: unknown, expected: UnitCubeCell): boolean => record(value)
    && integer(value.column) && integer(value.row) && integer(value.layer)
    && value.column === expected.column && value.row === expected.row && value.layer === expected.layer;
function groups(cells: readonly UnitCubeCell[], count: number, axis: 'column' | 'layer'): RectangularPrismCellGroup[] {
    return Array.from({length: count}, (_, index) => {
        const members = cells.filter(cell => cell[axis] === index);
        return {index, cells: members, cubeCount: members.length};
    });
}
function nonintegralInput(m: Measures, baseInput: boolean): boolean {
    return baseInput ? m.base.denominator !== 1 || m.height.denominator !== 1
        : m.length.denominator !== 1 || m.width.denominator !== 1 || m.height.denominator !== 1;
}

/** Pure model construction; relation input selects real proofs, never a learner action. */
export function buildFractionalRectangularPrismVolumeProblem(input: FractionalRectangularPrismBuildInput): FractionalRectangularPrismVolumeProblem {
    if (!record(input) || !['packing-count', 'packing-equivalence', 'triple-product', 'associative-triple-product',
        'edge-formula', 'base-area-formula'].includes(input.relationProfile)) return fail('Expected a supported mathematical relation.');
    const m = measures(input.packingBounds, input.partitionDenominator), baseInput = input.relationProfile === 'base-area-formula';
    if (!nonintegralInput(m, baseInput)) return fail('A selected measured input must be genuinely nonintegral.');
    // A complete JS array cannot represent a length beyond this intrinsic array limit.
    if (m.cubeCount > 0xffffffff) return fail('The complete packing exceeds representable array length.');
    const cells = Array.from({length: m.cubeCount}, (_, index) => cellAt(index, m));
    const count = (value: number) => scalar(BigInt(value));
    const data: FractionalRectangularPrismVolumeProblem = {
        kind: 'fractional-rectangular-prism-volume', unitId: 'generic', partitionDenominator: m.denominator,
        unitCubeEdgeLength: m.c, unitCubeFaceAreaSquareUnits: m.face, unitCubeVolumeCubicUnits: m.cube,
        unitCubeProducts: {faceArea: product(m.c, m.c), volume: product(m.face, m.c)},
        packingBounds: {columns: m.columns, rows: m.rows, layers: m.layers}, occupiedCells: cells,
        heightLayers: groups(cells, m.layers, 'layer'), cubesPerLayer: m.cubesPerLayer, cubeCount: m.cubeCount,
        countProducts: {layerCount: product(count(m.columns), count(m.rows)), totalCount: product(count(m.cubesPerLayer), count(m.layers))},
        dimensions: {length: m.length, width: m.width, height: m.height}, baseAreaSquareUnits: m.base, volumeCubicUnits: m.volume,
        physicalProducts: {baseArea: product(m.length, m.width), volume: product(m.base, m.height)},
        packingVolumeProduct: product(count(m.cubeCount), m.cube),
        measuredInput: baseInput ? {kind: 'base-area-height', baseAreaSquareUnits: m.base, heightUnits: m.height}
            : {kind: 'three-edges', lengthUnits: m.length, widthUnits: m.width, heightUnits: m.height}
    };
    const counting = input.relationProfile === 'packing-count' || input.relationProfile === 'packing-equivalence';
    const triple = input.relationProfile === 'triple-product' || input.relationProfile === 'associative-triple-product';
    return {...data,
        ...(counting ? {countingTrace: cells.map((cell, index) => ({cell, ordinal: index + 1}))} : {}),
        ...(input.relationProfile === 'packing-equivalence' ? {countedPackingEquivalence: {
            edgeScaleProducts: [product(count(m.columns), m.c), product(count(m.rows), m.c), product(count(m.layers), m.c)] as const,
            layerVolumeCubicUnits: m.layerVolume, countedLayerVolumeProduct: product(count(m.cubesPerLayer), m.cube),
            measuredLayerVolumeProduct: product(m.base, m.c), completeLayerVolumeProduct: product(count(m.layers), m.layerVolume)
        }} : {}),
        ...(triple ? {modeledTripleProduct: {factors: [m.length, m.width, m.height] as const,
            cubesPerLayer: m.cubesPerLayer, layerCount: m.layers, product: m.volume}} : {}),
        ...(input.relationProfile === 'associative-triple-product' ? {associativeRegrouping: {
            widthHeightProduct: m.widthHeight, widthHeightArithmetic: product(m.width, m.height),
            alternativeVolumeProduct: product(m.length, m.widthHeight), columnSlices: groups(cells, m.columns, 'column')
        }} : {})};
}

/** A supplied multiplication may commute its operands without changing its proof. */
function work(value: unknown, first: AlgebraicScalar, second: AlgebraicScalar, result: AlgebraicScalar): boolean {
    return record(value) && value.kind === 'binary' && value.operation === 'multiplication' && array(value.operands, 2)
        && sameScalar(value.result, result) && (sameScalar(value.operands[0], first) && sameScalar(value.operands[1], second)
            || sameScalar(value.operands[0], second) && sameScalar(value.operands[1], first));
}
function validGroups(value: unknown, m: Measures, axis: 'column' | 'layer'): boolean {
    const count = axis === 'layer' ? m.layers : m.columns, size = m.cubeCount / count;
    if (!array(value, count)) return false;
    for (let groupIndex = 0; groupIndex < count; groupIndex++) {
        const group = value[groupIndex];
        if (!record(group) || !integer(group.index) || group.index !== groupIndex || group.cubeCount !== size || !array(group.cells, size)) return false;
        for (let position = 0; position < size; position++) {
            const expected = axis === 'layer' ? cellAt(groupIndex * size + position, m)
                : {column: groupIndex, row: position % m.rows, layer: Math.floor(position / m.rows)};
            if (!sameCell(group.cells[position], expected)) return false;
        }
    }
    return true;
}

/** Full semantic acceptance, independent of builder profile, serialization or sampler caps. */
export function isFractionalRectangularPrismVolumeProblem(value: unknown): value is FractionalRectangularPrismVolumeProblem {
    try {
        if (!record(value) || value.kind !== 'fractional-rectangular-prism-volume' || value.unitId !== 'generic') return false;
        const m = measures(value.packingBounds, value.partitionDenominator), count = (n: number) => scalar(BigInt(n));
        if (value.cubesPerLayer !== m.cubesPerLayer || value.cubeCount !== m.cubeCount || !array(value.occupiedCells, m.cubeCount)) return false;
        for (let index = 0; index < m.cubeCount; index++) if (!sameCell(value.occupiedCells[index], cellAt(index, m))) return false;
        if (!validGroups(value.heightLayers, m, 'layer') || !sameScalar(value.unitCubeEdgeLength, m.c)
            || !sameScalar(value.unitCubeFaceAreaSquareUnits, m.face) || !sameScalar(value.unitCubeVolumeCubicUnits, m.cube)
            || !record(value.unitCubeProducts) || !work(value.unitCubeProducts.faceArea, m.c, m.c, m.face)
            || !work(value.unitCubeProducts.volume, m.face, m.c, m.cube) || !record(value.countProducts)
            || !work(value.countProducts.layerCount, count(m.columns), count(m.rows), count(m.cubesPerLayer))
            || !work(value.countProducts.totalCount, count(m.cubesPerLayer), count(m.layers), count(m.cubeCount))
            || !record(value.dimensions) || !sameScalar(value.dimensions.length, m.length) || !sameScalar(value.dimensions.width, m.width)
            || !sameScalar(value.dimensions.height, m.height) || !sameScalar(value.baseAreaSquareUnits, m.base)
            || !sameScalar(value.volumeCubicUnits, m.volume) || !record(value.physicalProducts)
            || !work(value.physicalProducts.baseArea, m.length, m.width, m.base)
            || !work(value.physicalProducts.volume, m.base, m.height, m.volume)
            || !work(value.packingVolumeProduct, count(m.cubeCount), m.cube, m.volume) || !record(value.measuredInput)) return false;
        const input = value.measuredInput, baseInput = input.kind === 'base-area-height';
        if (!nonintegralInput(m, baseInput) || !sameScalar(input.heightUnits, m.height)
            || (baseInput ? !sameScalar(input.baseAreaSquareUnits, m.base)
                : input.kind !== 'three-edges' || !sameScalar(input.lengthUnits, m.length) || !sameScalar(input.widthUnits, m.width))) return false;
        if (Object.hasOwn(value, 'countingTrace')) {
            if (!array(value.countingTrace, m.cubeCount)) return false;
            for (let index = 0; index < m.cubeCount; index++) {
                const row = value.countingTrace[index];
                if (!record(row) || row.ordinal !== index + 1 || !sameCell(row.cell, cellAt(index, m))) return false;
            }
        }
        const packing = Object.hasOwn(value, 'countedPackingEquivalence'), triple = Object.hasOwn(value, 'modeledTripleProduct');
        if (packing && triple || (packing || triple) && baseInput) return false;
        if (packing) {
            const proof = value.countedPackingEquivalence;
            if (!record(proof) || !Object.hasOwn(value, 'countingTrace') || !array(proof.edgeScaleProducts, 3)
                || !work(proof.edgeScaleProducts[0], count(m.columns), m.c, m.length)
                || !work(proof.edgeScaleProducts[1], count(m.rows), m.c, m.width)
                || !work(proof.edgeScaleProducts[2], count(m.layers), m.c, m.height)
                || !sameScalar(proof.layerVolumeCubicUnits, m.layerVolume)
                || !work(proof.countedLayerVolumeProduct, count(m.cubesPerLayer), m.cube, m.layerVolume)
                || !work(proof.measuredLayerVolumeProduct, m.base, m.c, m.layerVolume)
                || !work(proof.completeLayerVolumeProduct, count(m.layers), m.layerVolume, m.volume)) return false;
        }
        if (triple) {
            const proof = value.modeledTripleProduct;
            if (!record(proof) || !array(proof.factors, 3) || !sameScalar(proof.factors[0], m.length)
                || !sameScalar(proof.factors[1], m.width) || !sameScalar(proof.factors[2], m.height)
                || proof.cubesPerLayer !== m.cubesPerLayer || proof.layerCount !== m.layers || !sameScalar(proof.product, m.volume)) return false;
        }
        if (Object.hasOwn(value, 'associativeRegrouping')) {
            const proof = value.associativeRegrouping;
            if (!triple || !record(proof) || !sameScalar(proof.widthHeightProduct, m.widthHeight)
                || !work(proof.widthHeightArithmetic, m.width, m.height, m.widthHeight)
                || !work(proof.alternativeVolumeProduct, m.length, m.widthHeight, m.volume)
                || !validGroups(proof.columnSlices, m, 'column')) return false;
        }
        return true;
    } catch {return false;}
}
