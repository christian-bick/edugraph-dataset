import {describe, expect, it} from 'vitest';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import {IntegerRectangularPrismVolumeProblem as RectangularPrismVolumeProblem, UnitCubeCell} from '../../../types/problems.ts';
import {VolumeRectangularPrismGenerator} from './generator.ts';
import {VolumeRectangularPrismGeneratorConfig} from './spec.ts';

const profiles = [
    'packing-equivalence',
    'triple-product',
    'associative-triple-product',
    'edge-formula',
    'base-area-formula'
] as const;

const expectedCells = (length: number, width: number, height: number): UnitCubeCell[] => {
    const cells: UnitCubeCell[] = [];
    for (let layer = 0; layer < height; layer++) {
        for (let row = 0; row < width; row++) {
            for (let column = 0; column < length; column++) cells.push({column, row, layer});
        }
    }
    return cells;
};

const expectExactPrism = (data: RectangularPrismVolumeProblem): void => {
    const {length, width, height} = data.dimensions;
    expect(data.kind).toBe('rectangular-prism-volume');
    expect(data.unitId).toBe('generic');
    expect(data.unitCubeEdgeLength).toBe(1);
    expect([2, 3, 4]).toContain(length);
    expect([2, 3]).toContain(width);
    expect([2, 3]).toContain(height);
    expect(new Set([length, width, height]).size).toBeGreaterThan(1);
    expect(data.baseAreaSquareUnits).toBe(length * width);
    expect(data.volumeCubicUnits).toBe(length * width * height);
    expect(data.cubeCount).toBe(data.volumeCubicUnits);
    expect(data.cubeCount).toBeGreaterThanOrEqual(12);
    expect(data.cubeCount).toBeLessThanOrEqual(36);

    const cells = expectedCells(length, width, height);
    expect(data.occupiedCells).toEqual(cells);
    expect(new Set(cells.map(cell => JSON.stringify(cell))).size).toBe(data.cubeCount);
    expect(data.heightLayers).toEqual(Array.from({length: height}, (_, index) => ({
        index,
        cells: cells.filter(cell => cell.layer === index),
        cubeCount: length * width
    })));
    expect(data.heightLayers.flatMap(layer => layer.cells)).toEqual(cells);

    if (data.measuredInput.kind === 'three-edges') {
        expect(data.measuredInput).toEqual({kind: 'three-edges',
            lengthUnits: length, widthUnits: width, heightUnits: height});
    } else {
        expect(data.measuredInput).toEqual({kind: 'base-area-height',
            baseAreaSquareUnits: length * width, heightUnits: height});
    }
};

describe('VolumeRectangularPrismGenerator', () => {
    const generator = new VolumeRectangularPrismGenerator();

    it.each(profiles)('builds exact geometry and %s witnesses across seeded cases', relationProfile => {
        const shapes = new Set<string>();
        for (let seed = 0; seed < 160; seed++) {
            setSeed(`${relationProfile}-${seed}`);
            const data = generator.generate({relationProfile, numberDomain: 'integer'}).data;
            expectExactPrism(data);
            const {length, width, height} = data.dimensions;
            shapes.add(`${length}x${width}x${height}`);

            if (relationProfile === 'packing-equivalence') {
                expect(data.countedPackingEquivalence).toEqual({
                    cubesPerLayer: length * width,
                    layerCount: height,
                    countedCubes: data.cubeCount,
                    unitCubeVolumeCubicUnits: 1,
                    countedVolumeCubicUnits: data.cubeCount * 1
                });
            } else expect(data).not.toHaveProperty('countedPackingEquivalence');

            if (relationProfile === 'triple-product' || relationProfile === 'associative-triple-product') {
                expect(data.modeledTripleProduct).toEqual({
                    factors: [length, width, height],
                    cubesPerLayer: length * width,
                    layerCount: height,
                    product: length * width * height
                });
            } else expect(data).not.toHaveProperty('modeledTripleProduct');

            if (relationProfile === 'associative-triple-product') {
                expect(length).not.toBe(height);
                expect(data.associativeRegrouping).toEqual({
                    widthHeightProduct: width * height,
                    columnSlices: Array.from({length}, (_, index) => ({
                        index,
                        cells: data.occupiedCells.filter(cell => cell.column === index),
                        cubeCount: width * height
                    }))
                });
                expect((length * width) * height).toBe(length * (width * height));
                expect(length * width).not.toBe(width * height);
                expect(data.associativeRegrouping!.columnSlices.flatMap(slice => slice.cells))
                    .toHaveLength(data.cubeCount);
            } else expect(data).not.toHaveProperty('associativeRegrouping');

            expect(data.measuredInput.kind).toBe(relationProfile === 'base-area-formula'
                ? 'base-area-height' : 'three-edges');

            setSeed(`${relationProfile}-${seed}`);
            expect(generator.generate({relationProfile, numberDomain: 'integer'}).data).toEqual(data);
        }
        expect(shapes.size).toBeGreaterThanOrEqual(6);
    });

    it('rejects missing, malformed, and unsupported profiles before sampling', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate(null as never)).toThrow();
        for (const relationProfile of ['', 'cube', 'formula', true, 3]) {
            expect(() => generator.generate({relationProfile, numberDomain: 'integer'} as VolumeRectangularPrismGeneratorConfig))
                .toThrow('Expected a supported prism relation profile.');
        }
        for (const relationProfile of [null, undefined]) {
            expect(() => generator.generate({relationProfile} as VolumeRectangularPrismGeneratorConfig))
                .toThrow('Required field "relationProfile" is missing.');
        }
    });

    it.each(['packing-count', ...profiles] as const)('samples genuine fractional %s measurements with exact original-unit volumes', relationProfile => {
        const denominators = new Set<number>();
        for (let seed = 0; seed < 64; seed++) {
            setSeed(`fractional-${relationProfile}-${seed}`);
            const stub = generator.generate({relationProfile, numberDomain: 'fractional'}),data = stub.data;
            const {columns: c, rows: r, layers: h} = data.packingBounds,n = data.partitionDenominator;
            denominators.add(n);
            const equal = (value: {numerator: number; denominator: number}, numerator: number, denominator: number) =>
                expect(BigInt(value.numerator) * BigInt(denominator)).toBe(BigInt(numerator) * BigInt(value.denominator));
            expect(Object.keys(stub)).toEqual(['data']);
            equal(data.unitCubeEdgeLength,1,n);equal(data.unitCubeFaceAreaSquareUnits,1,n*n);equal(data.unitCubeVolumeCubicUnits,1,n*n*n);
            equal(data.dimensions.length,c,n);equal(data.dimensions.width,r,n);equal(data.dimensions.height,h,n);
            equal(data.baseAreaSquareUnits,c*r,n*n);equal(data.volumeCubicUnits,c*r*h,n*n*n);
            expect(data.cubeCount).toBe(c*r*h);expect(data.cubesPerLayer).toBe(c*r);
            expect(data.occupiedCells).toEqual(expectedCells(c,r,h));
            expect(data.heightLayers.map(layer=>layer.cubeCount)).toEqual(Array.from({length:h},()=>c*r));
            const input=data.measuredInput;
            const givens=input.kind==='three-edges'?[input.lengthUnits,input.widthUnits,input.heightUnits]:[input.baseAreaSquareUnits,input.heightUnits];
            expect(givens.some(value=>value.denominator!==1)).toBe(true);
            expect(input.kind).toBe(relationProfile==='base-area-formula'?'base-area-height':'three-edges');
            expect(data.countingTrace!==undefined).toBe(['packing-count','packing-equivalence'].includes(relationProfile));
            expect(data.countedPackingEquivalence!==undefined).toBe(relationProfile==='packing-equivalence');
            expect(data.modeledTripleProduct!==undefined).toBe(['triple-product','associative-triple-product'].includes(relationProfile));
            expect(data.associativeRegrouping!==undefined).toBe(relationProfile==='associative-triple-product');
            if(relationProfile==='associative-triple-product')expect(c).not.toBe(h);
            for(const field of ['profile','relationProfile','numberDomain','task','prompt','answer'])expect(data).not.toHaveProperty(field);
            const state=getRandomState(),next=random();
            setSeed(`fractional-${relationProfile}-${seed}`);expect(generator.generate({relationProfile,numberDomain:'fractional'})).toEqual(stub);
            expect(getRandomState()).toBe(state);expect(random()).toBe(next);
        }
        expect(denominators).toEqual(new Set([2,3,4]));
    });

    it('requires a real number domain and rejects unsupported integer bare counting before entropy',()=>{
        for(const numberDomain of [undefined,null,'decimal',false,3]) {
            setSeed(129);const state=getRandomState();
            expect(()=>generator.generate({relationProfile:'edge-formula',numberDomain} as never)).toThrow();
            expect(getRandomState()).toBe(state);
        }
        setSeed(129);const state=getRandomState();
        expect(()=>generator.generate({relationProfile:'packing-count',numberDomain:'integer'})).toThrow('fractional measurement domain');
        expect(getRandomState()).toBe(state);
    });
});
