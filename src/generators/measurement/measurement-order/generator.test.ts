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

    it('orders three distinct lengths in either requested direction', () => {
        for (const direction of [Scope.AscendingOrder, Scope.DescendingOrder] as const) {
            for (let seed = 0; seed < 30; seed++) {
                setSeed(seed);
                const stub = generator.generate({direction});
                expect(stub).not.toBeNull();
                const data = stub!.data as MeasurementOrderProblem;
                expect(new Set(data.objects.map(object => object.length)).size).toBe(3);
                const byId = new Map(data.objects.map(object => [object.id, object.length]));
                const orderedLengths = data.order.map(id => byId.get(id)!);
                expect(orderedLengths).toEqual(
                    [...orderedLengths].sort((a, b) => direction === Scope.AscendingOrder ? a - b : b - a)
                );
            }
        }
    });
});
