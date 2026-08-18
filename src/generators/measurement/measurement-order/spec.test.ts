import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementOrderGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('MeasurementOrderGenerator spec integration', () => {
    const generator = new MeasurementOrderGenerator();

    it('declares direct relation as an invariant capability', () => {
        expect(spec.generalLabels).toContain(Scope.DirectRelation);
    });

    it('resolves ascending and descending ordering', () => {
        for (const direction of [Scope.AscendingOrder, Scope.DescendingOrder] as const) {
            const stub = generateWithLabels(generator, [
                Area.MeasuringObjects,
                Scope.LengthMeasurement,
                Scope.DirectRelation,
                direction
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.direction).toBe(direction === Scope.AscendingOrder ? 'ascending' : 'descending');
            expect(stub!.tags).toContain(direction);
        }
    });
});
