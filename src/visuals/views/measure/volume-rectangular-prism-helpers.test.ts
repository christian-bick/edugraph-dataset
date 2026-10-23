import {describe, expect, it} from 'vitest';
import {VolumeRectangularPrismGenerator} from '../../../generators/measurement/volume-rectangular-prism/generator.ts';
import {buildFractionalRectangularPrismVolumeProblem} from '../../../generators/measurement/fractional-rectangular-prism-helpers.ts';
import {setSeed} from '../../../lib/random.ts';
import type {IntegerRectangularPrismVolumeProblem, UnitCubeCell} from '../../../types/problems.ts';
import {assembledPrismFaces, prismViewport} from './volume-unit-cube-helpers.ts';
import {isValidIntegerRectangularPrismVolume, isValidRectangularPrismVolume, prismExpression} from './volume-rectangular-prism-helpers.ts';

const profiles = [
    'packing-equivalence', 'triple-product', 'associative-triple-product',
    'edge-formula', 'base-area-formula'
] as const;

const fixture = (relationProfile: typeof profiles[number], seed = 17): IntegerRectangularPrismVolumeProblem => {
    setSeed(`${relationProfile}-${seed}`);
    const data = new VolumeRectangularPrismGenerator().generate({numberDomain: 'integer', relationProfile}).data;
    if (data.kind !== 'rectangular-prism-volume') throw Error('Expected the preserved integer producer branch.');
    return data;
};

/** Independent full integer family, including coherent cube/equal-factor members. */
const literal = (length: 2 | 3 | 4, width: 2 | 3, height: 2 | 3): IntegerRectangularPrismVolumeProblem => {
    const cells: UnitCubeCell[] = [];
    for (let layer = 0; layer < height; layer++) for (let row = 0; row < width; row++) for (let column = 0; column < length; column++) cells.push({column, row, layer});
    return {kind: 'rectangular-prism-volume', unitId: 'generic', unitCubeEdgeLength: 1, dimensions: {length, width, height},
        occupiedCells: cells, heightLayers: Array.from({length: height}, (_, index) => ({index, cells: cells.filter(cell => cell.layer === index), cubeCount: length * width})),
        baseAreaSquareUnits: length * width, cubeCount: length * width * height, volumeCubicUnits: length * width * height,
        measuredInput: {kind: 'three-edges', lengthUnits: length, widthUnits: width, heightUnits: height}};
};
const sparse = <T,>(values: readonly T[]): T[] => {const result = [...values]; delete result[0]; return result;};

describe('rectangular-prism view contract', () => {
    it.each(profiles)('accepts the complete %s producer payload', relationProfile => {
        for (let seed = 0; seed < 30; seed++) {
            const data = fixture(relationProfile, seed);
            expect(isValidRectangularPrismVolume(data)).toBe(true);
            expect(prismExpression(data).answer).toBe(`V = ${data.volumeCubicUnits} u³`);
        }
    });

    it('rejects missing, duplicate, reordered, and out-of-bounds cells', () => {
        const data = fixture('packing-equivalence');
        expect(isValidRectangularPrismVolume({...data, occupiedCells: data.occupiedCells.slice(1)})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, occupiedCells: [
            data.occupiedCells[0]!, ...data.occupiedCells.slice(0, -1)
        ]})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, occupiedCells: [
            data.occupiedCells[1]!, data.occupiedCells[0]!, ...data.occupiedCells.slice(2)
        ]})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, dimensions: {...data.dimensions, length: 5 as 4}})).toBe(false);
    });

    it('rejects false layer, measured-input, product, and counted-packing witnesses', () => {
        const data = fixture('packing-equivalence');
        expect(isValidRectangularPrismVolume({...data, baseAreaSquareUnits: 100})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, volumeCubicUnits: 100})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, heightLayers: [
            {...data.heightLayers[0]!, cubeCount: 1}, ...data.heightLayers.slice(1)
        ]})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, measuredInput: {
            kind: 'base-area-height', baseAreaSquareUnits: 100, heightUnits: data.dimensions.height
        }})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, countedPackingEquivalence: {
            ...data.countedPackingEquivalence!, countedCubes: data.cubeCount - 1
        }})).toBe(false);
    });

    it('rejects a false triple-product or associativity grouping', () => {
        const data = fixture('associative-triple-product');
        expect(isValidRectangularPrismVolume({...data, modeledTripleProduct: {
            ...data.modeledTripleProduct!, product: data.volumeCubicUnits + 1
        }})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, associativeRegrouping: {
            ...data.associativeRegrouping!, widthHeightProduct: 999
        }})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, associativeRegrouping: {
            ...data.associativeRegrouping!, columnSlices: [
                {...data.associativeRegrouping!.columnSlices[0]!,
                    cells: data.associativeRegrouping!.columnSlices[0]!.cells.slice(1)},
                ...data.associativeRegrouping!.columnSlices.slice(1)
            ]
        }})).toBe(false);
    });

    it('requires every supplied measured edge/height to repeat its physical role exactly', () => {
        const data = literal(4, 3, 2);
        for (const key of ['lengthUnits', 'widthUnits', 'heightUnits'] as const) {
            expect(isValidRectangularPrismVolume({...data, measuredInput: {...data.measuredInput, [key]: 99}})).toBe(false);
        }
        expect(isValidRectangularPrismVolume({...data, measuredInput: {kind: 'base-area-height', baseAreaSquareUnits: 12, heightUnits: 3}})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, measuredInput: {kind: 'unsupported'}})).toBe(false);
    });

    it('keeps every unit face in the SVG viewport at maximum prism bounds', () => {
        const bounds = {columns: 4, rows: 3, layers: 3};
        const viewport = prismViewport(bounds);
        const faces = assembledPrismFaces(bounds);
        expect(faces).toHaveLength(4 * 3 + 4 * 3 + 3 * 3);
        for (const face of faces) {
            for (const point of face.points) {
                expect(point.x).toBeGreaterThan(0);
                expect(point.x).toBeLessThan(viewport.width);
                expect(point.y).toBeGreaterThan(0);
                expect(point.y).toBeLessThan(viewport.height);
            }
        }
    });

    it('accepts every literal integer extent/input member without imposing the sampler cube exclusion', () => {
        for (const length of [2, 3, 4] as const) for (const width of [2, 3] as const) for (const height of [2, 3] as const) {
            const data = literal(length, width, height);
            for (const input of [data.measuredInput, {kind: 'base-area-height' as const, baseAreaSquareUnits: length * width, heightUnits: height}]) {
                expect(isValidIntegerRectangularPrismVolume({...data, measuredInput: input})).toBe(true);
                expect(isValidRectangularPrismVolume({...data, measuredInput: input})).toBe(true);
            }
        }
    });

    it('rejects sparse/inherited cells, groups, nested partitions and factors before skipping holes', () => {
        const data = fixture('associative-triple-product');
        const firstLayer = data.heightLayers[0]!, firstSlice = data.associativeRegrouping!.columnSlices[0]!;
        const inherited = sparse(data.occupiedCells);
        Object.setPrototypeOf(inherited, Object.assign(Object.create(Array.prototype), {0: data.occupiedCells[0]}));
        const cases = [
            {...data, occupiedCells: sparse(data.occupiedCells)}, {...data, occupiedCells: inherited},
            {...data, heightLayers: sparse(data.heightLayers)},
            {...data, heightLayers: [{...firstLayer, cells: sparse(firstLayer.cells)}, ...data.heightLayers.slice(1)]},
            {...data, heightLayers: [{...firstLayer, cells: [null, ...firstLayer.cells.slice(1)]}, ...data.heightLayers.slice(1)]},
            {...data, associativeRegrouping: {...data.associativeRegrouping!, columnSlices: sparse(data.associativeRegrouping!.columnSlices)}},
            {...data, associativeRegrouping: {...data.associativeRegrouping!, columnSlices: [{...firstSlice, cells: sparse(firstSlice.cells)}, ...data.associativeRegrouping!.columnSlices.slice(1)]}},
            {...data, modeledTripleProduct: {...data.modeledTripleProduct!, factors: sparse(data.modeledTripleProduct!.factors)}},
            {...data, occupiedCells: new Array(2 ** 32 - 1)}, {...data, heightLayers: new Array(2 ** 32 - 1)}
        ];
        for (const invalid of cases) expect(isValidRectangularPrismVolume(invalid)).toBe(false);
    });

    it('enforces the documented optional-proof dependencies without inferring a profile', () => {
        const packing = fixture('packing-equivalence'), triple = fixture('triple-product'), associative = fixture('associative-triple-product');
        const baseInput = {kind: 'base-area-height', baseAreaSquareUnits: packing.baseAreaSquareUnits, heightUnits: packing.dimensions.height};
        expect(isValidRectangularPrismVolume({...packing, modeledTripleProduct: triple.modeledTripleProduct})).toBe(false);
        expect(isValidRectangularPrismVolume({...packing, measuredInput: baseInput})).toBe(false);
        expect(isValidRectangularPrismVolume({...triple, measuredInput: {kind: 'base-area-height', baseAreaSquareUnits: triple.baseAreaSquareUnits, heightUnits: triple.dimensions.height}})).toBe(false);
        expect(isValidRectangularPrismVolume({...associative, modeledTripleProduct: undefined})).toBe(false);
        expect(isValidRectangularPrismVolume({...packing, countedPackingEquivalence: null})).toBe(false);
        expect(isValidRectangularPrismVolume({...triple, modeledTripleProduct: null})).toBe(false);
        expect(isValidRectangularPrismVolume({...associative, associativeRegrouping: null})).toBe(false);
        expect(isValidRectangularPrismVolume({...associative, associativeRegrouping: undefined})).toBe(true);
        expect(isValidRectangularPrismVolume({...packing, countedPackingEquivalence: undefined})).toBe(true);
    });

    it('dispatches every new fractional mathematical profile while preserving the old guard boundary', () => {
        for (const relationProfile of ['packing-count', ...profiles] as const) {
            const data = buildFractionalRectangularPrismVolumeProblem({packingBounds: {columns: 3, rows: 2, layers: 1}, partitionDenominator: 2, relationProfile});
            const before = JSON.stringify(data);
            expect(isValidRectangularPrismVolume(data)).toBe(true);
            expect(isValidIntegerRectangularPrismVolume(data)).toBe(false);
            expect(JSON.stringify(data)).toBe(before);
            expect(isValidRectangularPrismVolume({...data, volumeCubicUnits: {numerator: 7, denominator: 4}})).toBe(false);
        }
    });

    it('is total for malformed objects, cycles and accessors in either mathematical member', () => {
        const data = fixture('edge-formula'), cycle: Record<string, unknown> = {}; cycle.dimensions = cycle;
        const throwKind = Object.defineProperty({}, 'kind', {get() {throw Error('malformed');}});
        const throwDimensions = Object.defineProperty({...data}, 'dimensions', {get() {throw Error('malformed');}});
        for (const invalid of [undefined, null, true, 'prism', [], {}, cycle, throwKind, throwDimensions, {...data, kind: 'unknown'}]) {
            expect(isValidRectangularPrismVolume(invalid)).toBe(false);
            expect(isValidIntegerRectangularPrismVolume(invalid)).toBe(false);
        }
    });

    it('preserves the literal integer formula/substitution strings and data order', () => {
        const data = literal(4, 3, 2), before = JSON.stringify(data);
        expect(prismExpression(data)).toEqual({formula: 'V = length × width × height', substitution: 'V = 4 u × 3 u × 2 u', answer: 'V = 24 u³'});
        expect(prismExpression({...data, measuredInput: {kind: 'base-area-height', baseAreaSquareUnits: 12, heightUnits: 2}})).toEqual({formula: 'V = base area × height', substitution: 'V = 12 u² × 2 u', answer: 'V = 24 u³'});
        expect(isValidRectangularPrismVolume(data)).toBe(true);
        expect(JSON.stringify(data)).toBe(before);
    });
});
