import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementOrderGenerator} from './generator.ts';

describe('MeasurementOrderGenerator spec integration', () => {
    const generator = new MeasurementOrderGenerator();

    it('resolves least-first and most-first ordering', () => {
        for (const relation of [Scope.Least, Scope.Most] as const) {
            const stub = generateWithLabels(generator, [
                Area.Measurement,
                Area.ObjectSorting,
                Scope.LengthMeasurement,
                relation
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.direction).toBe(relation === Scope.Least ? 'ascending' : 'descending');
            expect(stub!.tags).toContain(relation);
        }
    });
});
