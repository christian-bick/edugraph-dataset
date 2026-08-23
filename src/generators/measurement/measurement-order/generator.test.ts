import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementOrderProblem} from '../../../types/problems.ts';
import {MeasurementOrderGenerator} from './generator.ts';

describe('MeasurementOrderGenerator', () => {
    const generator = new MeasurementOrderGenerator();

    it('strictly validates direction configuration', () => {
        expect(() => generator.generate({} as any)).toThrow();
    });

    it('orders three visibly distinct lengths in either requested direction', () => {
        for (const direction of [Scope.AscendingOrder, Scope.DescendingOrder] as const) {
            for (let seed = 0; seed < 30; seed++) {
                setSeed(seed);
                const stub = generator.generate({direction});
                expect(stub).not.toBeNull();
                const data = stub!.data as MeasurementOrderProblem;
                expect(data.magnitudes).toEqual([...data.magnitudes].sort((a, b) => a - b));
                expect(data.magnitudes[1] - data.magnitudes[0]).toBeGreaterThanOrEqual(20);
                expect(data.magnitudes[2] - data.magnitudes[1]).toBeGreaterThanOrEqual(20);
                expect(data.direction).toBe(
                    direction === Scope.AscendingOrder ? 'ascending' : 'descending'
                );
                expect(data).not.toHaveProperty('objects');
                expect(data).not.toHaveProperty('order');
            }
        }
    });
});
