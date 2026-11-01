import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {UnitRateRelationsGenerator} from './generator.ts';
import {UnitRateRelationsGeneratorSchema as schema, spec} from './spec.ts';
import {unitRateFramesForRange, unitRateRangeProfiles} from './numeric-domain.ts';
import {spec as languageSpec} from '../../../visuals/views/ratio/unit-rate-language/spec.ts';
import {spec as problemSpec} from '../../../visuals/views/ratio/unit-rate-problem/spec.ts';

describe('unit-rate-relations capabilities', () => {
    it('resolves all four finite bands directly and through planned choices for both consumers', () => {
        expect(unitRateRangeProfiles.map(({range}) => [range.min, range.max])).toEqual([[0, 5], [0, 10], [0, 20], [0, 100]]);
        expect(unitRateRangeProfiles.map(({range}) => unitRateFramesForRange(range).length)).toEqual([22, 74, 144, 1027]);
        const evaluator = createLabelDependencyEvaluator();
        for (const profile of unitRateRangeProfiles) {
            expect(extractConfig(schema, profile.labels).config.range).toEqual(profile.range);
            expect(resolveSchemaChoices(schema, profile.labels, {range: profile.labels}).config.range).toEqual(profile.range);
            for (const view of [languageSpec, problemSpec]) {
                const labels = [...spec.generalLabels!, ...view.generalLabels!, ...profile.labels];
                const result = evaluator.evaluate(labels);
                expect(result.errors).toEqual([]);
                expect(result.conflicts).toEqual([]);
                expect(result.assessments.filter(item => item.status === 'missing')).toEqual([]);
            }
            expect(generateWithLabels(new UnitRateRelationsGenerator(), profile.labels)!.labels).toEqual(profile.labels);
        }
        expect(generateWithLabels(new UnitRateRelationsGenerator(), [])).not.toBeNull();
    });

    it('uses the same mathematical relation for interpretation and execution', () => {
        setSeed(19);
        const interpreted = generateWithLabels(new UnitRateRelationsGenerator(), [Scope.NumbersSmaller100, Ability.Interpretation]);
        setSeed(19);
        expect(generateWithLabels(new UnitRateRelationsGenerator(), [Scope.NumbersSmaller100, Ability.ProcedureExecution])).toEqual(interpreted);
    });
});
