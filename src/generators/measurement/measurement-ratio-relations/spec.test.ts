import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {MeasurementRatioRelationsGenerator} from './generator.ts';
import {MeasurementRatioRelationsGeneratorSchema as schema, spec} from './spec.ts';
import {conversionRatioRangeProfiles} from './numeric-domain.ts';
import {spec as viewSpec} from '../../../visuals/views/measure/measure-ratio-conversion/spec.ts';

describe('measurement-ratio-relations capabilities', () => {
    it('resolves every finite canonical band with required multiplicative identity1 and no positive floor', () => {
        expect(conversionRatioRangeProfiles.map(({range}) => [range.min, range.max]))
            .toEqual([[0, 20], [0, 100], [0, 120], [0, 1000], [0, 10000], [0, 100000]]);
        const evaluator = createLabelDependencyEvaluator();
        for (const profile of conversionRatioRangeProfiles) {
            expect(extractConfig(schema, profile.labels).config.range).toEqual(profile.range);
            expect(resolveSchemaChoices(schema, profile.labels, {range: profile.labels}).config.range).toEqual(profile.range);
            const result = evaluator.evaluate([...spec.generalLabels!, ...viewSpec.generalLabels!, ...profile.labels]);
            expect(result.errors).toEqual([]);
            expect(result.conflicts).toEqual([]);
            expect(result.assessments.filter(item => item.status === 'missing')).toEqual([]);
            expect(generateWithLabels(new MeasurementRatioRelationsGenerator(), profile.labels)!.labels).toEqual(profile.labels);
        }
        const problem = generateWithLabels(new MeasurementRatioRelationsGenerator(), [
            Area.UnitConversion, Area.RatioEquivalence, Scope.RationalNumbers,
            Ability.ProcedureExecution, Ability.ProcedureUnderstanding
        ])!;
        expect(problem.data.kind).toBe('measurement-ratio-relation');
    });

    it('keeps the symmetric relation independent of requested learner action', () => {
        setSeed(71);
        const execution = generateWithLabels(new MeasurementRatioRelationsGenerator(), [Scope.NumbersSmaller10000, Ability.ProcedureExecution]);
        setSeed(71);
        expect(generateWithLabels(new MeasurementRatioRelationsGenerator(), [Scope.NumbersSmaller10000, Ability.ProcedureUnderstanding])).toEqual(execution);
    });
});
