import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import type {AlgebraExpressionEquivalenceProblem} from '../../../types/problems.ts';
import {spec as generateView, AlgebraEquivalentExpressionGenerateViewSchema} from '../../../visuals/views/operations/algebra-equivalent-expression-generate/spec.ts';
import {spec as judgeView, AlgebraExpressionEquivalenceJudgeViewSchema} from '../../../visuals/views/operations/algebra-expression-equivalence-judge/spec.ts';
import {AlgebraExpressionEquivalenceGenerator} from './generator.ts';
import {AlgebraExpressionEquivalenceGeneratorSchema, spec} from './spec.ts';

const views = [[generateView, AlgebraEquivalentExpressionGenerateViewSchema], [judgeView, AlgebraExpressionEquivalenceJudgeViewSchema]] as const;
function plan(labels: readonly string[], entry: typeof views[number], id = 'affine-identity') {
    return planCompatibility({identity: {targetId: id, generatorId: spec.generatorId, viewId: entry[0].viewId}, targetLabels: labels,
        generatorLabels: spec.generalLabels, viewLabels: entry[0].generalLabels, generatorRules: spec.compatibility, viewRules: entry[0].compatibility,
        fields: [...normalizeSchemaChoices(AlgebraExpressionEquivalenceGeneratorSchema, labels, 'generator'), ...normalizeSchemaChoices(entry[1], labels, 'view')]});
}

describe('affine identity ownership and exact production planning', () => {
    it('declares precisely one invariant and five genuine complete mathematical bundles', () => {
        expect(spec.generalLabels).toEqual([Area.AlgebraicExpression]);
        expect(Object.keys(AlgebraExpressionEquivalenceGeneratorSchema)).toEqual(['relation']);
        expect(AlgebraExpressionEquivalenceGeneratorSchema.relation[2]).toEqual([[Area.DistributingLinearCombinations], [Area.CollectingLinearTerms],
            [Area.AlgebraicEquivalence, Area.AssociativeLaw], [Area.AlgebraicEquivalence, Area.CommutativeLaw], [Area.AlgebraicEquivalence]]);
        expect(findSchemaFallbackContractIssues(AlgebraExpressionEquivalenceGeneratorSchema)).toEqual([]);
        const configs = new Set<string>();
        for (const labels of AlgebraExpressionEquivalenceGeneratorSchema.relation[2]) {
            const relation = AlgebraExpressionEquivalenceGeneratorSchema.relation[1]([...labels]);
            configs.add(relation!);
            expect(new AlgebraExpressionEquivalenceGenerator().generate({relation}).data.validIdentity.steps.length).toBeGreaterThan(0);
        }
        expect(configs.size).toBe(5);
    });

    it('executes all five authored target plans with exact emitted labels and only the reviewed task', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target => target.id.startsWith('6.EE.A.3-generate-equivalent-expressions~')
            || target.id.startsWith('6.EE.A.4-identify-equivalent-expressions~'));
        expect(targets).toHaveLength(5);
        for (const target of targets) for (const entry of views) {
            const result = plan(target.labels, entry, target.id);
            expect(result.supported).toBe(target.labels.includes(Ability.CorrectnessEvaluation) === (entry[0] === judgeView));
            if (!result.supported) continue;
            for (let seed = 0; seed < 16; seed++) {
                const draw = generatePlannedDraw({generator: new AlgebraExpressionEquivalenceGenerator(), viewSchema: entry[1], plan: result.plan,
                    sampleKey: `${target.id}#${spec.generatorId}#${entry[0].viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                const data = draw.stub!.data as AlgebraExpressionEquivalenceProblem;
                if (entry[0] === judgeView) expect(data.validIdentity.steps[0].kind).toBe('coefficient-normalization');
            }
        }
    });

    it('keeps the broad judge free of hidden fallback properties and excludes numeric-property requests', () => {
        const labels = [Area.AlgebraicExpression, Area.AlgebraicEquivalence, Scope.ArabicNumerals, Ability.CorrectnessEvaluation];
        const result = plan(labels, views[1]);
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        expect(result.plan.domains.filter(domain => domain.owner === 'generator').map(domain => domain.alternatives.length)).toEqual([1]);
        for (const extra of [Area.DistributingLinearCombinations, Area.CollectingLinearTerms, Area.AssociativeLaw, Area.CommutativeLaw]) {
            expect(plan([...labels, extra], views[1]).supported).toBe(false);
        }
        expect(plan([Area.CommutativeLaw, Scope.ArabicNumerals, Ability.ProcedureExecution], views[0]).supported).toBe(false);
    });

    it('does not condition canonical mathematics on the requested Ability', () => {
        setSeed(19); const first = generateWithLabels(new AlgebraExpressionEquivalenceGenerator(), [Area.DistributingLinearCombinations, Ability.ProcedureExecution]);
        setSeed(19); expect(generateWithLabels(new AlgebraExpressionEquivalenceGenerator(), [Area.DistributingLinearCombinations, Ability.CorrectnessEvaluation])).toEqual(first);
        expect(() => new AlgebraExpressionEquivalenceGenerator().generate({})).toThrow();
    });
});
