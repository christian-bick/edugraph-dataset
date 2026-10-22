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
import {spec as lineView, AlgebraInequalityNumberlineViewSchema} from '../../../visuals/views/operations/algebra-inequality-numberline/spec.ts';
import {spec as infiniteView, AlgebraInequalityInfiniteSolutionsViewSchema} from '../../../visuals/views/operations/algebra-inequality-infinite-solutions/spec.ts';
import {spec as modelView, AlgebraInequalityModelViewSchema} from '../../../visuals/views/operations/algebra-inequality-model/spec.ts';
import {AlgebraInequalitiesGenerator} from './generator.ts';
import {AlgebraInequalitiesGeneratorSchema, spec} from './spec.ts';

const views = [[checkView, AlgebraSubstitutionCheckViewSchema], [meaningView, AlgebraSolutionMeaningViewSchema], [lineView, AlgebraInequalityNumberlineViewSchema],
    [infiniteView, AlgebraInequalityInfiniteSolutionsViewSchema], [modelView, AlgebraInequalityModelViewSchema]] as const;
function plan(labels: readonly string[], entry: typeof views[number], id = 'strict-predicate') {
    return planCompatibility({identity: {targetId: id, generatorId: spec.generatorId, viewId: entry[0].viewId}, targetLabels: labels,
        generatorLabels: spec.generalLabels, viewLabels: entry[0].generalLabels, generatorRules: spec.compatibility, viewRules: entry[0].compatibility,
        fields: [...normalizeSchemaChoices(AlgebraInequalitiesGeneratorSchema, labels, 'generator'), ...normalizeSchemaChoices(entry[1], labels, 'view')]});
}
describe('strict inequality mathematical capability ownership', () => {
    it('declares four genuine domain families and one real strict direction', () => {
        expect(spec.generalLabels).toEqual([Area.Inequality, Scope.NoExpressions]);
        expect(Object.keys(AlgebraInequalitiesGeneratorSchema)).toEqual(['relation', 'direction']);
        expect(findSchemaFallbackContractIssues(AlgebraInequalitiesGeneratorSchema)).toEqual([]);
        expect(AlgebraInequalitiesGeneratorSchema.relation[2].map(labels => AlgebraInequalitiesGeneratorSchema.relation[1]([...labels])))
            .toEqual(['instantiated-predicate', 'finite-extension', 'rational-half-line', 'quantitative-threshold']);
        expect(AlgebraInequalitiesGeneratorSchema.direction[2]).toEqual([[Scope.Less], [Scope.Greater]]);
    });
    it('executes all eight authored inequality targets with the intended task and no hidden fallback Areas', () => {
        const prefixes = ['6.EE.B.5-check-substitution~', '6.EE.B.5-interpret-solution-process~', '6.EE.B.8-graph-inequality-solutions~',
            '6.EE.B.8-interpret-infinite-solutions~', '6.EE.B.8-model-strict-inequalities~'];
        const targets = [...activeTargets, ...implementationTodos].filter(target => target.labels.includes(Area.Inequality) && prefixes.some(prefix => target.id.startsWith(prefix)));
        expect(targets).toHaveLength(8);
        for (const target of targets) for (const entry of views) {
            const expectedView = target.id.includes('check-substitution') ? checkView : target.id.includes('interpret-solution-process') ? meaningView
                : target.id.includes('graph-inequality') ? lineView : target.id.includes('interpret-infinite') ? infiniteView : modelView;
            const result = plan(target.labels, entry, target.id); expect(result.supported).toBe(entry[0] === expectedView);
            if (!result.supported) continue;
            const directions = new Set<string>();
            for (let seed = 0; seed < 16; seed++) {
                const draw = generatePlannedDraw({generator: new AlgebraInequalitiesGenerator(), viewSchema: entry[1], plan: result.plan,
                    sampleKey: `${target.id}#${spec.generatorId}#${entry[0].viewId}#train#question#inst:0`, seed, attempt: 1});
                const data = draw.stub!.data; directions.add(data.statement.operator);
                expect(new Set(draw.labels)).toEqual(new Set([...target.labels, Scope.NoExpressions, data.statement.operator === 'less' ? Scope.Less : Scope.Greater]));
                if (entry[0] === lineView || entry[0] === infiniteView) expect(data.ambientSolution.kind).toBe('ray');
                if (entry[0] === modelView) expect(data.ambientSolution.kind).toBe('interval');
            }
            expect(directions.size).toBe(target.labels.includes(Scope.Less) || target.labels.includes(Scope.Greater) ? 1 : 2);
        }
    });
    it('does not let ray interpretations silently select finite solving or contextual evidence', () => {
        const base = [Area.Inequality, Area.SolutionSet, Scope.NoExpressions, Scope.Less, Scope.ArabicNumerals, Ability.Interpretation];
        expect(plan(base, views[3]).supported).toBe(true);
        for (const extra of [Area.InequalitySolving, Area.AlgebraicModeling, Area.AlgebraicSubstitution, Area.RelationSatisfaction]) expect(plan([...base, extra], views[3]).supported).toBe(false);
        setSeed(31); const first = generateWithLabels(new AlgebraInequalitiesGenerator(), [Area.SolutionSet, Scope.Less, Ability.VisualArticulation]);
        setSeed(31); expect(generateWithLabels(new AlgebraInequalitiesGenerator(), [Area.SolutionSet, Scope.Less, Ability.Interpretation])).toEqual(first);
    });
});
