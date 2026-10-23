import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {spec as view, StatisticalQuestionClassificationViewSchema} from '../../../visuals/views/statistics/statistical-question-classification/spec.ts';
import {isStatisticalQuestionsProblem} from '../statistical-question-helpers.ts';
import {StatisticalQuestionsGenerator} from './generator.ts';
import {spec, StatisticalQuestionsGeneratorSchema} from './spec.ts';

describe('statistical-question claim ownership and production planning', () => {
    it('declares genuine presence/absence alternatives with complete fallback sets and one fixed view Ability', () => {
        expect(spec.generalLabels).toEqual([]);
        expect(Object.keys(StatisticalQuestionsGeneratorSchema)).toEqual(['anticipatedVariation']);
        expect(StatisticalQuestionsGeneratorSchema.anticipatedVariation[0]).toEqual([Area.StatisticalQuestion]);
        expect(StatisticalQuestionsGeneratorSchema.anticipatedVariation[2]).toEqual([[], [Area.StatisticalQuestion]]);
        expect(findSchemaFallbackContractIssues(StatisticalQuestionsGeneratorSchema)).toEqual([]);
        expect(StatisticalQuestionClassificationViewSchema).toEqual({});
        expect(view.generalLabels).toEqual([Ability.ConceptClassification]);
    });

    it('executes the one actual reviewed target with the complete emitted Area/Ability claim', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target => target.id.startsWith('6.SP.A.1-classify-statistical-questions~'));
        expect(targets).toHaveLength(1);
        const target = targets[0]!;
        const result = planCompatibility({identity: {targetId: target.id, generatorId: spec.generatorId, viewId: view.viewId},
            targetLabels: target.labels, generatorLabels: spec.generalLabels, viewLabels: view.generalLabels,
            generatorRules: spec.compatibility, viewRules: view.compatibility,
            fields: [...normalizeSchemaChoices(StatisticalQuestionsGeneratorSchema, target.labels, 'generator'),
                ...normalizeSchemaChoices(StatisticalQuestionClassificationViewSchema, target.labels, 'view')]});
        if (!result.supported) throw Error('The reviewed statistical-question route is not supported.');
        const input = {plan: result.plan, sampleKey: `${target.id}#${spec.generatorId}#${view.viewId}#train#question#inst:0`, seed: 91, attempt: 1};
        const resolved = resolvePlannedConfigurations({...input, generatorSchema: StatisticalQuestionsGeneratorSchema, viewSchema: StatisticalQuestionClassificationViewSchema});
        expect(resolved.generatorConfig).toEqual({anticipatedVariation: 'present'});
        const draw = generatePlannedDraw({...input, generator: new StatisticalQuestionsGenerator(), viewSchema: StatisticalQuestionClassificationViewSchema});
        expect(new Set(draw.labels)).toEqual(new Set(target.labels));
        const data = draw.stub?.data;
        if (!isStatisticalQuestionsProblem(data)) throw Error('The production draw lacks the complete investigation model.');
        expect(data.investigations.some(row => row.variability.kind === 'anticipated-variation')).toBe(true);
    });

    it('keeps source meaning independent of Ability and emits StatisticalQuestion only for present variation', () => {
        for (const present of [false, true]) {
            const labels = present ? [Area.StatisticalQuestion] : [], binding = {anticipatedVariation: labels};
            const first = resolveSchemaChoices(StatisticalQuestionsGeneratorSchema, [...labels, Ability.ConceptClassification], binding);
            const second = resolveSchemaChoices(StatisticalQuestionsGeneratorSchema, [...labels, Ability.TextualReception], binding);
            expect(second).toEqual(first);
            expect(first.config).toEqual({anticipatedVariation: present ? 'present' : 'absent'});
            expect(first.resolvedLabels).toEqual(labels);
            setSeed(712); const original = new StatisticalQuestionsGenerator().generate(first.config);
            setSeed(712); expect(new StatisticalQuestionsGenerator().generate(second.config)).toEqual(original);
            setSeed(712); const annotated = generateWithLabels(new StatisticalQuestionsGenerator(), [...labels, Ability.ConceptClassification]);
            expect(annotated?.data).toEqual(original.data);
            expect(annotated?.labels).toEqual(labels);
            expect(original.data.investigations.some(row => row.variability.kind === 'anticipated-variation')).toBe(present);
        }
    });
});
