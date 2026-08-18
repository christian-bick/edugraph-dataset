import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MediatedLengthComparisonProblem} from '../../../types/problems.ts';
import {MeasurementMediatedComparisonGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('MeasurementMediatedComparisonGenerator spec integration', () => {
    const generator = new MeasurementMediatedComparisonGenerator();

    it('declares mediated length comparison as an invariant capability', () => {
        expect(spec.generalLabels).toContain(Scope.LengthMeasurement);
        expect(spec.generalLabels).toContain(Scope.MediatedRelation);
    });

    it('resolves greater and less comparison targets', () => {
        for (const relation of [Scope.Greater, Scope.Less] as const) {
            const stub = generateWithLabels(generator, [
                Area.MeasuringObjects,
                Scope.LengthMeasurement,
                Scope.MediatedRelation,
                relation
            ]);
            expect(stub).not.toBeNull();
            const data = stub!.data as MediatedLengthComparisonProblem;
            expect(data.askedRelation).toBe(relation === Scope.Greater ? 'longer' : 'shorter');
            expect(data.answer).toBe(data.premises[0].relation === data.askedRelation ? 'A' : 'C');
            expect(stub!.tags).toContain(relation);
        }
    });
});
