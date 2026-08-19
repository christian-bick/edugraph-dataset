import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {AreaDecompositionGenerator} from './generator.ts';

const generator = new AreaDecompositionGenerator();

describe('AreaDecompositionGenerator', () => {
    it('requires a supported decomposition kind', () => {
        expect(() => generator.generate({})).toThrow();
    });

    it('produces a consistent split rectangle', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({
                useDistributiveModel: true,
                distributiveFeatures: [Area.Multiplication, Scope.ThreeOperands]
            })!.data;

            expect(data.kind).toBe('distributive');
            if (data.kind !== 'distributive') throw new Error('Expected distributive data.');

            expect(data.height).toBeGreaterThanOrEqual(2);
            expect(data.height).toBeLessThanOrEqual(5);
            expect(data.leftWidth).toBeGreaterThanOrEqual(2);
            expect(data.rightWidth).toBeGreaterThanOrEqual(2);
            expect(data.totalWidth).toBe(data.leftWidth + data.rightWidth);
            expect(data.leftArea).toBe(data.height * data.leftWidth);
            expect(data.rightArea).toBe(data.height * data.rightWidth);
            expect(data.totalArea).toBe(data.leftArea + data.rightArea);
            expect(data.totalArea).toBe(data.height * data.totalWidth);
        }
    });

    it('produces a consistent L-shaped rectilinear decomposition', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({
                useDistributiveModel: false,
                distributiveFeatures: []
            })!.data;

            expect(data.kind).toBe('rectilinear');
            if (data.kind !== 'rectilinear') throw new Error('Expected rectilinear data.');
            expect(data.leftArea).toBe(data.leftWidth * data.totalHeight);
            expect(data.rightArea).toBe(data.rightWidth * data.bottomHeight);
            expect(data.totalArea).toBe(data.leftArea + data.rightArea);
            expect(data.bottomHeight).toBeLessThan(data.totalHeight);
        }
    });

    it('is deterministic for a fixed seed', () => {
        setSeed(27);
        const config = {
            useDistributiveModel: true,
            distributiveFeatures: [Area.Multiplication, Scope.ThreeOperands]
        };
        const first = generator.generate(config);
        setSeed(27);
        expect(generator.generate(config)).toEqual(first);
    });
});
