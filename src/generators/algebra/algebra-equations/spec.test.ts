import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {spec as checkView, AlgebraSubstitutionCheckViewSchema} from '../../../visuals/views/operations/algebra-substitution-check/spec.ts';
import {spec as meaningView, AlgebraSolutionMeaningViewSchema} from '../../../visuals/views/operations/algebra-solution-meaning/spec.ts';
import {spec as modelView, AlgebraEquationModelSolveViewSchema} from '../../../visuals/views/operations/algebra-equation-model-solve/spec.ts';
import {AlgebraEquationsGenerator} from './generator.ts';
import {AlgebraEquationsGeneratorSchema, spec} from './spec.ts';

const views = [[checkView, AlgebraSubstitutionCheckViewSchema], [meaningView, AlgebraSolutionMeaningViewSchema], [modelView, AlgebraEquationModelSolveViewSchema]] as const;
function plan(labels: readonly string[], entry: typeof views[number], id = 'elementary-equation') {
    return planCompatibility({identity: {targetId: id, generatorId: spec.generatorId, viewId: entry[0].viewId}, targetLabels: labels,
        generatorLabels: spec.generalLabels, viewLabels: entry[0].generalLabels, generatorRules: spec.compatibility, viewRules: entry[0].compatibility,
        fields: [...normalizeSchemaChoices(AlgebraEquationsGeneratorSchema, labels, 'generator'), ...normalizeSchemaChoices(entry[1], labels, 'view')]});
}
describe('elementary equation mathematical capability ownership', () => {
    it('has four real complete mathematical bundles and visible invariant one-sided rational structure', () => {
        expect(spec.generalLabels).toEqual([Area.Equation, Scope.ExpressionOnOneSide, Scope.RationalNumbers]);
        expect(Object.keys(AlgebraEquationsGeneratorSchema)).toEqual(['relation']);
        expect(findSchemaFallbackContractIssues(AlgebraEquationsGeneratorSchema)).toEqual([]);
        expect(AlgebraEquationsGeneratorSchema.relation[2]).toHaveLength(4);
        expect(AlgebraEquationsGeneratorSchema.relation[2].map(labels => AlgebraEquationsGeneratorSchema.relation[1]([...labels])))
            .toEqual(['instantiated-predicate', 'finite-extension', 'nonnegative-sum-preimage', 'nonnegative-product-preimage']);
    });
    it('executes all four authored equation plans with precisely their intended leaf and complete emitted claims', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target => target.labels.includes(Area.Equation)
            && ['6.EE.B.5-check-substitution~', '6.EE.B.5-interpret-solution-process~', '6.EE.B.7-model-and-solve-rational-equations~'].some(prefix => target.id.startsWith(prefix)));
        expect(targets).toHaveLength(4);
        for (const target of targets) for (const entry of views) {
            const expectedView = target.id.includes('check-substitution') ? checkView : target.id.includes('interpret-solution-process') ? meaningView : modelView;
            const result = plan(target.labels, entry, target.id); expect(result.supported).toBe(entry[0] === expectedView);
            if (!result.supported) continue;
            for (let seed = 0; seed < 8; seed++) {
                const draw = generatePlannedDraw({generator: new AlgebraEquationsGenerator(), viewSchema: entry[1], plan: result.plan,
                    sampleKey: `${target.id}#${spec.generatorId}#${entry[0].viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(new Set(draw.labels)).toEqual(new Set([...target.labels, Scope.RationalNumbers, Scope.ExpressionOnOneSide]));
                expect(draw.stub?.data.kind).toBe('algebra-equations');
            }
        }
    });
    it('rejects hidden satisfaction, solving and model fallbacks in sibling projections', () => {
        const check = [Area.Equation, Area.AlgebraicSubstitution, Area.RelationSatisfaction, Scope.ArabicNumerals, Ability.ProcedureExecution, Ability.CorrectnessEvaluation];
        const meaning = [Area.Equation, Area.EquationSolving, Area.SolutionSet, Scope.ArabicNumerals, Ability.ProcedureUnderstanding];
        for (const extra of [Area.SolutionSet, Area.EquationSolving, Area.AlgebraicModeling]) expect(plan([...check, extra], views[0]).supported).toBe(false);
        for (const extra of [Area.AlgebraicSubstitution, Area.RelationSatisfaction, Area.AlgebraicModeling]) expect(plan([...meaning, extra], views[1]).supported).toBe(false);
        expect(plan([Area.Equation, Scope.ArabicNumerals, Ability.ProcedureExecution], views[0]).supported).toBe(false);
        setSeed(29); const first = generateWithLabels(new AlgebraEquationsGenerator(), [Area.AlgebraicSubstitution, Area.RelationSatisfaction, Ability.ProcedureExecution]);
        setSeed(29); expect(generateWithLabels(new AlgebraEquationsGenerator(), [Area.AlgebraicSubstitution, Area.RelationSatisfaction, Ability.CorrectnessEvaluation])).toEqual(first);
    });
});
