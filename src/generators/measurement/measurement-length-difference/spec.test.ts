import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {MeasurementLengthDifferenceGenerator} from './generator.ts';
import {MeasurementLengthDifferenceGeneratorSchema as schema} from './spec.ts';
import {lengthDifferenceRangeProfiles} from './numeric-domain.ts';

describe('measurement-length-difference schema', () => {
    it('retains the existing task and resolves every feasible profile in both paths', () => {
        const task = [Area.Difference, Scope.CentimeterScale, Scope.DirectRelation, Ability.ProcedureExecution];
        expect(generateWithLabels(new MeasurementLengthDifferenceGenerator(), task)).not.toBeNull();
        expect(lengthDifferenceRangeProfiles.map(profile => [profile.range.min, profile.range.max]))
            .toEqual([[0, 10], [5, 10], [0, 20], [5, 20], [5, 100]]);
        for (const profile of lengthDifferenceRangeProfiles) {
            const labels = [...task, ...profile.labels];
            const direct = extractConfig(schema, labels);
            const planned = resolveSchemaChoices(schema, labels, {range: profile.labels});
            expect(planned.config.range).toEqual(profile.range);
            expect(direct.config.range!.max).toBe(profile.range.max);
            if (profile.range.min > 0) expect(direct.config).toEqual(planned.config);
        }
    });
});
