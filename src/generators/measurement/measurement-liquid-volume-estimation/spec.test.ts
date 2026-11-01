import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {MeasurementLiquidVolumeEstimationGenerator} from './generator.ts';
import {MeasurementLiquidVolumeEstimationGeneratorSchema as schema, spec} from './spec.ts';
import {liquidEstimateRangeProfiles} from './numeric-domain.ts';

describe('measurement-liquid-volume-estimation spec', () => {
    it('resolves both exact upper bands in direct and planned paths without a universal floor', () => {
        expect(liquidEstimateRangeProfiles.map(({range}) => [range.min, range.max])).toEqual([[0, 5], [0, 10]]);
        for (const profile of liquidEstimateRangeProfiles) {
            expect(extractConfig(schema, profile.labels).config.range).toEqual(profile.range);
            expect(resolveSchemaChoices(schema, profile.labels, {range: profile.labels}).config.range).toEqual(profile.range);
            const result = createLabelDependencyEvaluator().evaluate([...spec.generalLabels!, ...profile.labels, Ability.ProcedureExecution]);
            expect(result.errors).toEqual([]);
            expect(result.conflicts).toEqual([]);
            expect(result.assessments.filter(item => item.status === 'missing')).toEqual([]);
            expect(profile.labels).not.toContain(Scope.NumbersLargerZero);
        }
        expect(generateWithLabels(new MeasurementLiquidVolumeEstimationGenerator(), [])!.data.unit).toBe('L');
    });
});
