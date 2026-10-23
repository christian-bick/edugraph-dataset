import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicScalar, ExactCoefficientArithmetic, FractionalRectangularPrismVolumeProblem, UnitCubeCell} from '../../types/problems.ts';
import {buildFractionalRectangularPrismVolumeProblem as build, isFractionalRectangularPrismVolumeProblem as valid,
    type FractionalPrismRelationProfile, type FractionalRectangularPrismBuildInput} from './fractional-rectangular-prism-helpers.ts';

const profiles: FractionalPrismRelationProfile[] = ['packing-count', 'packing-equivalence', 'triple-product',
    'associative-triple-product', 'edge-formula', 'base-area-formula'];
/** Independent exact oracle, including safe-component boundary values. */
function q(numerator: number | bigint, denominator: number | bigint = 1): AlgebraicScalar {
    let n = BigInt(numerator), d = BigInt(denominator), a = n, b = d;
    while (b !== 0n) [a, b] = [b, a % b];
    n /= a; d /= a;
    return {numerator: Number(n), denominator: Number(d)};
}
const mul = (a: AlgebraicScalar, b: AlgebraicScalar, result: AlgebraicScalar): ExactCoefficientArithmetic =>
    ({kind: 'binary', operation: 'multiplication', operands: [a, b], result});
const input = (profile: FractionalPrismRelationProfile, C = 3, R = 2, H = 1, n = 2): FractionalRectangularPrismBuildInput =>
    ({packingBounds: {columns: C, rows: R, layers: H}, partitionDenominator: n, relationProfile: profile});

/** Complete literal six-cube half-unit prism. No producer math builds this expected object. */
function literal(): FractionalRectangularPrismVolumeProblem {
    const cells: UnitCubeCell[] = [
        {column: 0, row: 0, layer: 0}, {column: 1, row: 0, layer: 0}, {column: 2, row: 0, layer: 0},
        {column: 0, row: 1, layer: 0}, {column: 1, row: 1, layer: 0}, {column: 2, row: 1, layer: 0}
    ];
    return {kind: 'fractional-rectangular-prism-volume', unitId: 'generic', partitionDenominator: 2,
        unitCubeEdgeLength: q(1, 2), unitCubeFaceAreaSquareUnits: q(1, 4), unitCubeVolumeCubicUnits: q(1, 8),
        unitCubeProducts: {faceArea: mul(q(1, 2), q(1, 2), q(1, 4)), volume: mul(q(1, 4), q(1, 2), q(1, 8))},
        packingBounds: {columns: 3, rows: 2, layers: 1}, occupiedCells: cells,
        heightLayers: [{index: 0, cells, cubeCount: 6}], cubesPerLayer: 6, cubeCount: 6,
        countProducts: {layerCount: mul(q(3), q(2), q(6)), totalCount: mul(q(6), q(1), q(6))},
        dimensions: {length: q(3, 2), width: q(1), height: q(1, 2)}, baseAreaSquareUnits: q(3, 2), volumeCubicUnits: q(3, 4),
        physicalProducts: {baseArea: mul(q(3, 2), q(1), q(3, 2)), volume: mul(q(3, 2), q(1, 2), q(3, 4))},
        packingVolumeProduct: mul(q(6), q(1, 8), q(3, 4)),
        measuredInput: {kind: 'three-edges', lengthUnits: q(3, 2), widthUnits: q(1), heightUnits: q(1, 2)}};
}
function replace(data: unknown, path: string, value: unknown): unknown {
    const copy = structuredClone(data) as Record<string, unknown>, keys = path.split('.');
    let row = copy;
    for (const key of keys.slice(0, -1)) row = row[key] as Record<string, unknown>;
    row[keys.at(-1)!] = value;
    return copy;
}
function without(data: FractionalRectangularPrismVolumeProblem, field: string): unknown {
    const copy = structuredClone(data) as unknown as Record<string, unknown>;
    delete copy[field];
    return copy;
}
function commute(value: unknown): void {
    if (typeof value !== 'object' || value === null) return;
    const row = value as Record<string, unknown>;
    if (row.kind === 'binary') (row.operands as unknown[]).reverse();
    for (const child of Object.values(value)) commute(child);
}

describe('fractional rectangular prism mathematical model', () => {
    it('matches the independent complete six-cube literal and physical units exactly', () => {
        expect(build(input('edge-formula'))).toEqual(literal());
        expect(valid(literal())).toBe(true);
        const packing = build(input('packing-equivalence'));
        expect(packing.countingTrace).toEqual(literal().occupiedCells.map((cell, index) => ({cell, ordinal: index + 1})));
        expect(packing.countedPackingEquivalence).toEqual({
            edgeScaleProducts: [mul(q(3), q(1, 2), q(3, 2)), mul(q(2), q(1, 2), q(1)), mul(q(1), q(1, 2), q(1, 2))],
            layerVolumeCubicUnits: q(3, 4), countedLayerVolumeProduct: mul(q(6), q(1, 8), q(3, 4)),
            measuredLayerVolumeProduct: mul(q(3, 2), q(1, 2), q(3, 4)), completeLayerVolumeProduct: mul(q(1), q(3, 4), q(3, 4))});
        const association = build(input('associative-triple-product'));
        expect(association.modeledTripleProduct).toEqual({factors: [q(3, 2), q(1), q(1, 2)], cubesPerLayer: 6, layerCount: 1, product: q(3, 4)});
        expect(association.associativeRegrouping).toEqual({widthHeightProduct: q(1, 2),
            widthHeightArithmetic: mul(q(1), q(1, 2), q(1, 2)), alternativeVolumeProduct: mul(q(3, 2), q(1, 2), q(3, 4)),
            columnSlices: [0, 1, 2].map(column => ({index: column, cubeCount: 2,
                cells: [{column, row: 0, layer: 0}, {column, row: 1, layer: 0}]}))});
    });

    it('materializes only the actual selected relation and rejects no-op fractional givens', () => {
        for (const profile of profiles) {
            const data = build(input(profile));
            expect(valid(data)).toBe(true);
            expect(Object.hasOwn(data, 'countingTrace')).toBe(['packing-count', 'packing-equivalence'].includes(profile));
            expect(Object.hasOwn(data, 'countedPackingEquivalence')).toBe(profile === 'packing-equivalence');
            expect(Object.hasOwn(data, 'modeledTripleProduct')).toBe(['triple-product', 'associative-triple-product'].includes(profile));
            expect(Object.hasOwn(data, 'associativeRegrouping')).toBe(profile === 'associative-triple-product');
            expect(Object.hasOwn(data, 'relationProfile')).toBe(false);
        }
        expect(build(input('edge-formula', 4, 3, 2)).dimensions.width).toEqual(q(3, 2));
        expect(() => build(input('base-area-formula', 4, 3, 2))).toThrow(/nonintegral/);
        for (const profile of profiles) expect(() => build(input(profile, 2, 2, 2))).toThrow(/nonintegral/);
        for (const profile of ['edge-formula', 'base-area-formula'] as const) {
            const data = build(input(profile, 4, 2, 3));
            expect(data.volumeCubicUnits).toEqual(q(3));
            expect(valid(data)).toBe(true);
        }
    });

    it('agrees with independent rational and nested-loop geometry oracles across admitted small domains', () => {
        let admitted = 0, excluded = 0;
        for (let n = 2; n <= 5; n++) for (let C = 1; C <= 6; C++) for (let R = 1; R <= 3; R++) for (let H = 1; H <= 3; H++) {
            const cells: UnitCubeCell[] = [];
            for (let layer = 0; layer < H; layer++) for (let row = 0; row < R; row++) for (let column = 0; column < C; column++) cells.push({column, row, layer});
            for (const profile of profiles) {
                const fractional = profile === 'base-area-formula' ? (C * R) % (n * n) !== 0 || H % n !== 0
                    : C % n !== 0 || R % n !== 0 || H % n !== 0;
                if (!fractional) {expect(() => build(input(profile, C, R, H, n))).toThrow(GeneratorValidationError); excluded++; continue;}
                const data = build(input(profile, C, R, H, n));
                expect(valid(data)).toBe(true);
                expect(data.dimensions).toEqual({length: q(C, n), width: q(R, n), height: q(H, n)});
                expect([data.baseAreaSquareUnits, data.cubeCount, data.volumeCubicUnits]).toEqual([q(C * R, n * n), C * R * H, q(C * R * H, n ** 3)]);
                expect(data.occupiedCells).toEqual(cells);
                expect(data.heightLayers).toEqual(Array.from({length: H}, (_, layer) => ({index: layer, cubeCount: C * R, cells: cells.filter(cell => cell.layer === layer)})));
                if (data.associativeRegrouping) expect(data.associativeRegrouping.columnSlices).toEqual(Array.from({length: C}, (_, column) =>
                    ({index: column, cubeCount: R * H, cells: cells.filter(cell => cell.column === column)})));
                admitted++;
            }
        }
        expect(admitted).toBeGreaterThan(1200);
        expect(excluded).toBeGreaterThan(0);
    });

    it('preserves non-dyadic fractions, broad bounds and safe denominator boundaries without sampler caps', () => {
        const thirds = build(input('packing-equivalence', 4, 2, 3, 3));
        expect(thirds.volumeCubicUnits).toEqual(q(8, 9));
        expect(thirds.countedPackingEquivalence!.layerVolumeCubicUnits).toEqual(q(8, 27));
        const fourths = build(input('associative-triple-product', 3, 2, 3, 4));
        expect(fourths.volumeCubicUnits).toEqual(q(9, 32));
        const wide = build(input('associative-triple-product', 7, 4, 2, 5));
        expect(valid(wide)).toBe(true);
        expect(wide.associativeRegrouping!.widthHeightProduct).toEqual(q(8, 25));
        const maximum = build(input('packing-equivalence', 1, 1, 1, 208063));
        expect(maximum.unitCubeVolumeCubicUnits).toEqual(q(1n, 208063n ** 3n));
        expect(valid(maximum)).toBe(true);
        expect(() => build(input('edge-formula', 1, 1, 1, 208064))).toThrow(/safe/);
    });

    it('accepts commuted exact work and coherent optional proofs independently of canonical profiles', () => {
        for (const profile of profiles) {
            const data = structuredClone(build(input(profile, 4, 2, 3, 3)));
            commute(data);
            expect(valid(data)).toBe(true);
        }
        const base = build(input('base-area-formula'));
        const trace = build(input('packing-count')).countingTrace;
        expect(valid({...base, countingTrace: trace})).toBe(true);
        expect(valid({...build(input('associative-triple-product')), countingTrace: trace})).toBe(true);
        expect(valid({...base, irrelevantExtension: 'not a canonical-profile serialization'})).toBe(true);
    });

    it('rejects malformed builder inputs before allocating complete arrays', () => {
        const bad: unknown[] = [null, {}, {relationProfile: 'unknown'}, {...input('edge-formula'), packingBounds: null},
            ...[-0, 0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1].map(columns => ({...input('edge-formula'), packingBounds: {columns, rows: 1, layers: 1}})),
            ...[0, -0, 1, 1.5, Infinity, NaN].map(partitionDenominator => ({...input('edge-formula'), partitionDenominator})),
            input('edge-formula', Number.MAX_SAFE_INTEGER, 2, 1), input('edge-formula', 4294967296, 1, 1, 3)];
        for (const value of bad) expect(() => build(value as FractionalRectangularPrismBuildInput)).toThrow(GeneratorValidationError);
    });
});

describe('fractional prism total guard', () => {
    it('rejects malformed physical/count/work data rather than repairing it', () => {
        const data = literal();
        const mutations: [string, unknown][] = [
            ['kind', 'rectangular-prism-volume'], ['unitId', 'cm'], ['partitionDenominator', 1], ['packingBounds', []],
            ['packingBounds.rows', 0], ['packingBounds.layers', -1], ['cubesPerLayer', 3], ['cubeCount', 3],
            ['occupiedCells', []], ['occupiedCells.0', null], ['occupiedCells.0.column', -0], ['occupiedCells.1.column', 0],
            ['occupiedCells.0.row', 1], ['occupiedCells.0.layer', 1], ['heightLayers', []], ['heightLayers.0', null],
            ['heightLayers.0.index', -0], ['heightLayers.0.index', 1], ['heightLayers.0.cubeCount', 7], ['heightLayers.0.cells', []],
            ['heightLayers.0.cells.0.column', 1], ['unitCubeEdgeLength', q(1)], ['unitCubeFaceAreaSquareUnits', q(1, 2)],
            ['unitCubeVolumeCubicUnits', q(6)], ['unitCubeEdgeLength', {numerator: 2, denominator: 4}],
            ['unitCubeProducts', null], ['unitCubeProducts.faceArea', null], ['unitCubeProducts.faceArea.kind', 'power'],
            ['unitCubeProducts.faceArea.operation', 'addition'], ['unitCubeProducts.faceArea.operands', []],
            ['unitCubeProducts.faceArea.operands.0', q(2)], ['unitCubeProducts.faceArea.result', q(1)],
            ['unitCubeProducts.volume.operands.1', q(2)], ['countProducts', null], ['countProducts.layerCount.result', q(3, 2)],
            ['countProducts.totalCount.result', q(3, 4)], ['dimensions', null], ['dimensions.length', q(3)],
            ['dimensions.width', q(2)], ['dimensions.height', q(1)], ['baseAreaSquareUnits', q(6)], ['volumeCubicUnits', q(6)],
            ['physicalProducts', []], ['physicalProducts.baseArea.operands.1', q(2)], ['physicalProducts.volume.result', q(6)],
            ['packingVolumeProduct.operands.0', q(3, 4)], ['measuredInput', null], ['measuredInput.kind', 'unknown'],
            ['measuredInput.lengthUnits', q(3)], ['measuredInput.widthUnits', q(2)], ['measuredInput.heightUnits', q(1)],
            ['dimensions.length', {numerator: -0, denominator: 1}], ['dimensions.width', {numerator: -1, denominator: 1}]
        ];
        for (const [path, value] of mutations) expect(valid(replace(data, path, value)), path).toBe(false);
        expect(valid(replace(build(input('base-area-formula')), 'measuredInput.baseAreaSquareUnits', q(6)))).toBe(false);
        // Internally coherent hidden fractional edges still cannot justify an all-integer B×h input.
        const hidden = build(input('edge-formula', 4, 3, 2));
        expect(valid({...hidden, measuredInput: {kind: 'base-area-height', baseAreaSquareUnits: q(3), heightUnits: q(1)}})).toBe(false);
        const integral = build(input('edge-formula', 4, 2, 3));
        expect(valid({...integral, partitionDenominator: Number.MAX_SAFE_INTEGER})).toBe(false);
    });

    it('validates the complete counting trace and every layer-equivalence certificate', () => {
        const data = build(input('packing-equivalence', 4, 2, 3, 3));
        const mutations: [string, unknown][] = [
            ['countingTrace', undefined], ['countingTrace', []], ['countingTrace.0', null], ['countingTrace.0.ordinal', 2],
            ['countingTrace.0.cell.column', 2], ['countedPackingEquivalence', undefined], ['countedPackingEquivalence.edgeScaleProducts', []],
            ['countedPackingEquivalence.edgeScaleProducts.0.result', q(4)], ['countedPackingEquivalence.edgeScaleProducts.1.result', q(2)],
            ['countedPackingEquivalence.edgeScaleProducts.2.result', q(3)], ['countedPackingEquivalence.layerVolumeCubicUnits', q(8)],
            ['countedPackingEquivalence.countedLayerVolumeProduct.result', q(8)], ['countedPackingEquivalence.measuredLayerVolumeProduct.result', q(8)],
            ['countedPackingEquivalence.completeLayerVolumeProduct.result', q(24)]
        ];
        for (const [path, value] of mutations) expect(valid(replace(data, path, value)), path).toBe(false);
        expect(valid(without(data, 'countingTrace'))).toBe(false);
        expect(valid({...data, modeledTripleProduct: build(input('triple-product', 4, 2, 3, 3)).modeledTripleProduct})).toBe(false);
        expect(valid({...data, measuredInput: {kind: 'base-area-height', baseAreaSquareUnits: data.baseAreaSquareUnits, heightUnits: data.dimensions.height}})).toBe(false);
    });

    it('validates ordered physical triple factors and the complete associative column partition', () => {
        const data = build(input('associative-triple-product', 4, 2, 3, 3));
        const mutations: [string, unknown][] = [
            ['modeledTripleProduct', undefined], ['modeledTripleProduct.factors', []], ['modeledTripleProduct.factors.0', q(4)],
            ['modeledTripleProduct.factors.1', q(2)], ['modeledTripleProduct.factors.2', q(3)], ['modeledTripleProduct.cubesPerLayer', 2],
            ['modeledTripleProduct.layerCount', 2], ['modeledTripleProduct.product', q(24)], ['associativeRegrouping', undefined],
            ['associativeRegrouping.widthHeightProduct', q(6)], ['associativeRegrouping.widthHeightArithmetic.result', q(6)],
            ['associativeRegrouping.alternativeVolumeProduct.result', q(24)], ['associativeRegrouping.columnSlices', []],
            ['associativeRegrouping.columnSlices.0.cells.0', null], ['associativeRegrouping.columnSlices.0.cells.1.row', 0]
        ];
        for (const [path, value] of mutations) expect(valid(replace(data, path, value)), path).toBe(false);
        expect(valid(without(data, 'modeledTripleProduct'))).toBe(false);
        expect(valid({...data, measuredInput: {kind: 'base-area-height', baseAreaSquareUnits: data.baseAreaSquareUnits, heightUnits: data.dimensions.height}})).toBe(false);
    });

    it('fails sparse/prototype-hole/huge arrays cheaply and remains total for hostile unknown objects', () => {
        const sparse = new Array(0xffffffff);
        const huge = {...literal(), packingBounds: {columns: 0xffffffff, rows: 1, layers: 1},
            cubesPerLayer: 0xffffffff, cubeCount: 0xffffffff, occupiedCells: sparse};
        expect(valid(huge)).toBe(false);
        const prototypeHole = new Array(6); Object.setPrototypeOf(prototypeHole, {0: literal().occupiedCells[0], length: 6});
        expect(valid({...literal(), occupiedCells: prototypeHole})).toBe(false);
        for (const path of ['occupiedCells', 'heightLayers.0.cells', 'countingTrace', 'countedPackingEquivalence.edgeScaleProducts',
            'associativeRegrouping.columnSlices.0.cells']) {
            const data = build(input(path.startsWith('associative') ? 'associative-triple-product' : 'packing-equivalence'));
            let row: unknown = data;
            for (const key of path.split('.')) row = (row as Record<string, unknown>)[key];
            expect(valid(replace(data, path, new Array((row as unknown[]).length))), path).toBe(false);
        }
        const cyclic: Record<string, unknown> = {}; cyclic.kind = cyclic;
        const accessor = Object.defineProperty({}, 'kind', {get: () => {throw Error('accessor');}});
        const nested = {...literal(), unitCubeEdgeLength: Object.defineProperty({}, 'numerator', {get: () => {throw Error('scalar accessor');}})};
        for (const value of [null, undefined, true, 4, '', [], {}, cyclic, accessor, nested]) {
            expect(() => valid(value)).not.toThrow();
            expect(valid(value)).toBe(false);
        }
    });
});
