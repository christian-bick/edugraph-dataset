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

    it('resolves least-first and most-first ordering', () => {
        for (const relation of [Scope.Least, Scope.Most] as const) {
            const stub = generateWithLabels(generator, [
                Area.Measurement,
                Area.ObjectSorting,
                Scope.LengthMeasurement,
                Scope.DirectRelation,
                relation
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.direction).toBe(relation === Scope.Least ? 'ascending' : 'descending');
            expect(stub!.tags).toContain(relation);
        }
    });
});
