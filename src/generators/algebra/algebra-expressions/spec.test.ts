import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import type {AlgebraicExpressionProblem, ExactPowerFact} from '../../../types/problems.ts';
import {spec as write, AlgebraExpressionWriteViewSchema as writeSchema} from '../../../visuals/views/operations/algebra-expression-write/spec.ts';
import {spec as parts, AlgebraExpressionPartsViewSchema as partsSchema} from '../../../visuals/views/operations/algebra-expression-parts/spec.ts';
import {spec as grouped, AlgebraSubexpressionInterpretationViewSchema as groupedSchema} from '../../../visuals/views/operations/algebra-subexpression-interpretation/spec.ts';
import {spec as evaluate, AlgebraExpressionEvaluateViewSchema as evaluateSchema} from '../../../visuals/views/operations/algebra-expression-evaluate/spec.ts';
import {spec as formula, AlgebraFormulaEvaluateViewSchema as formulaSchema} from '../../../visuals/views/operations/algebra-formula-evaluate/spec.ts';
import {spec as model, AlgebraExpressionModelViewSchema as modelSchema} from '../../../visuals/views/operations/algebra-expression-model/spec.ts';
import {AlgebraExpressionsGenerator} from './generator.ts';
import {AlgebraExpressionsGeneratorSchema, spec} from './spec.ts';

const viewEntries = [[write, writeSchema], [parts, partsSchema], [grouped, groupedSchema], [evaluate, evaluateSchema],
    [formula, formulaSchema], [model, modelSchema]] as const;
const sourcePrefixes = ['6.EE.A.2a-write-letter-expressions~', '6.EE.A.2b-identify-expression-parts~',
    '6.EE.A.2b-interpret-subexpressions~', '6.EE.A.2c-evaluate-variable-expressions~', '6.EE.B.6-model-contextual-expression~'];
const plan = (targetId: string, labels: readonly string[], entry: typeof viewEntries[number]) => planCompatibility({
    identity: {targetId, generatorId: spec.generatorId, viewId: entry[0].viewId}, targetLabels: labels,
    generatorLabels: spec.generalLabels, viewLabels: entry[0].generalLabels,
    generatorRules: spec.compatibility, viewRules: entry[0].compatibility,
    fields: [...normalizeSchemaChoices(AlgebraExpressionsGeneratorSchema, labels, 'generator'),
        ...normalizeSchemaChoices(entry[1], labels, 'view')]
});

describe('algebra expression capability ownership and composition', () => {
    it('resolves complete mathematical bundles without invariant expression-kind or Ability claims', () => {
        expect(spec.generalLabels).toEqual([]);
        expect(Object.keys(AlgebraExpressionsGeneratorSchema)).toEqual(['relation', 'power']);
        expect(findSchemaFallbackContractIssues(AlgebraExpressionsGeneratorSchema)).toEqual([]);
        const relationBundles = AlgebraExpressionsGeneratorSchema.relation[2];
        expect(relationBundles).toHaveLength(16);
        expect(AlgebraExpressionsGeneratorSchema.power[2]).toEqual([[], [Area.Exponentiation, Scope.IntegerExponent],
            [Area.Exponentiation, Scope.IntegerExponent, Scope.PositiveExponent]]);
        const values = new Set<string>();
        for (const relation of relationBundles) for (const power of AlgebraExpressionsGeneratorSchema.power[2]) {
            const labels = [...relation, ...power];
            const config = {relation: AlgebraExpressionsGeneratorSchema.relation[1](labels),
                power: AlgebraExpressionsGeneratorSchema.power[1](labels)};
            if (power.length && !relation.includes(Area.AlgebraicSubstitution as never)) continue;
            values.add(JSON.stringify(config));
            const stub = new AlgebraExpressionsGenerator().generate(config);
            expect(stub.data.structuralExpression.kind).toBe(relation.includes(Area.ArithmeticExpression as never) ? 'numeric' : 'symbolic');
        }
        expect(values.size).toBe(18);
    });

    it('executes all 21 reviewed actual target plans with exactly their observable claims', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target => sourcePrefixes.some(prefix => target.id.startsWith(prefix)));
        expect(targets).toHaveLength(21);
        for (const target of targets) {
            const intendedViewId = target.id.startsWith(sourcePrefixes[0]) ? write.viewId
                : target.id.startsWith(sourcePrefixes[1]) ? parts.viewId
                    : target.id.startsWith(sourcePrefixes[2]) ? grouped.viewId
                        : target.id.startsWith(sourcePrefixes[4]) ? model.viewId
                            : target.labels.includes(Ability.TextualReception) ? formula.viewId : evaluate.viewId;
            for (const entry of viewEntries) {
                const result = plan(target.id, target.labels, entry);
                expect(result.supported, `${target.id} at ${entry[0].viewId}`).toBe(entry[0].viewId === intendedViewId);
                if (!result.supported) continue;
                for (let seed = 0; seed < 8; seed++) {
                    const draw = generatePlannedDraw({generator: new AlgebraExpressionsGenerator(), viewSchema: entry[1], plan: result.plan,
                        sampleKey: `${target.id}#${spec.generatorId}#${entry[0].viewId}#train#question#inst:0`, seed, attempt: 1});
                    expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                    const data = draw.stub!.data as AlgebraicExpressionProblem;
                    if (target.labels.includes(Area.AlgebraicModeling)) expect(data.context.kind).toBe('quantitative-system');
                    if (target.labels.includes(Area.OrderOfOperations)) expect(data.substitution.precedenceWitness).not.toBeNull();
                    if (target.labels.includes(Scope.PositiveExponent)) expect(data.substitution.powerFacts.every((fact: ExactPowerFact) => fact.exponent > 0)).toBe(true);
                    expect(data.substitution.powerFacts.length > 0).toBe(target.labels.includes(Area.Exponentiation));
                }
            }
        }
    });

    it('does not let a prescribed phrase acquire hidden fallback structural or modeling claims', () => {
        const labels = [Area.AlgebraicExpression, Scope.ArabicNumerals, Ability.Formalization, Ability.TextualReception];
        const result = plan('prescribed-phrase', labels, viewEntries[0]);
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        expect(result.plan.domains.filter(domain => domain.owner === 'generator').map(domain => domain.alternatives.length)).toEqual([1, 1]);
        for (const extra of [Area.Term, Area.Factor, Area.Coefficient, Area.Addition, Area.Multiplication, Area.Division,
            Area.GroupingSymbol, Area.Operand, Area.AlgebraicSubstitution, Area.OrderOfOperations, Area.AlgebraicModeling, Area.Exponentiation]) {
            expect(plan(`phrase-${extra}`, [...labels, extra], viewEntries[0]).supported).toBe(false);
        }
    });

    it('keeps seeded concrete mathematics independent of the requested learner action', () => {
        const labels = [Area.AlgebraicExpression, Area.AlgebraicSubstitution, Area.OrderOfOperations, Area.Exponentiation, Scope.IntegerExponent];
        setSeed(41); const first = generateWithLabels(new AlgebraExpressionsGenerator(), [...labels, Ability.ProcedureExecution]);
        setSeed(41); expect(generateWithLabels(new AlgebraExpressionsGenerator(), [...labels, Ability.Interpretation])).toEqual(first);
        expect(() => new AlgebraExpressionsGenerator().generate({})).toThrow();
    });
});
