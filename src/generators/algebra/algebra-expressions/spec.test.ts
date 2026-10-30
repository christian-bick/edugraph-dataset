import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
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
import {numericProfileLabels, profilesForRelation} from './numeric-profiles.ts';

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
        expect(Object.keys(AlgebraExpressionsGeneratorSchema)).toEqual(['relation', 'power', 'numericProfile']);
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
            for (const numericProfile of profilesForRelation(config.relation!)) {
                values.add(JSON.stringify({...config, numericProfile}));
                const stub = new AlgebraExpressionsGenerator().generate({...config, numericProfile})!;
                expect(stub.data.structuralExpression.kind).toBe(relation.includes(Area.ArithmeticExpression as never) ? 'numeric' : 'symbolic');
            }
        }
        expect(values.size).toBe(34);
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
                    const supportedLabels: string[] = [write.viewId, parts.viewId, grouped.viewId].includes(intendedViewId)
                        ? [Scope.Base10] : [];
                    if (target.labels.includes(Area.ArithmeticExpression) || intendedViewId === write.viewId) {
                        supportedLabels.push(Scope.RationalNumbers);
                    } else if ([parts.viewId, grouped.viewId].includes(intendedViewId)) {
                        supportedLabels.push(Scope.IntegerNumbers);
                    }
                    expect(new Set(draw.labels.filter(label => !numericProfileLabels.includes(label as never))))
                        .toEqual(new Set([...target.labels, ...supportedLabels]));
                    expect(draw.labels.filter(label => numericProfileLabels.includes(label as never)))
                        .toHaveLength(target.labels.includes(Area.ArithmeticExpression) || intendedViewId === write.viewId ? 2
                            : target.labels.includes(Area.Division) ? 1 : 0);
                    const data = draw.stub!.data as AlgebraicExpressionProblem;
                    if (target.labels.includes(Area.AlgebraicModeling)) expect(data.context.kind).toBe('quantitative-system');
                    if (target.labels.includes(Area.OrderOfOperations)) expect(data.substitution.precedenceWitness).not.toBeNull();
                    if (target.labels.includes(Scope.PositiveExponent)) expect(data.substitution.powerFacts.every((fact: ExactPowerFact) => fact.exponent > 0)).toBe(true);
                    expect(data.substitution.powerFacts.length > 0).toBe(target.labels.includes(Area.Exponentiation));
                }
            }
        }
    });

    it('annotates integer literals and only the proved quotient zero absence without claiming a variable domain or sign', () => {
        const roles = [[Area.Term], [Area.Factor], [Area.Coefficient], [Area.Addition],
            [Area.Multiplication], [Area.Division], [Area.GroupingSymbol, Area.Operand]];
        const evaluator = createLabelDependencyEvaluator();
        for (const role of roles) {
            const requested = [Area.AlgebraicExpression, ...role];
            const resolved = extractConfig(AlgebraExpressionsGeneratorSchema, requested);
            expect(resolved.resolvedLabels).toContain(Scope.IntegerNumbers);
            expect(resolved.resolvedLabels).not.toContain(Scope.RationalNumbers);
            expect(resolved.config.numericProfile).toBe(0);
            expect(resolved.resolvedLabels.filter(label => numericProfileLabels.includes(label as never)))
                .toEqual(role.includes(Area.Division) ? [Scope.NumbersWithoutZero] : []);
            const evaluated = evaluator.evaluate([...resolved.resolvedLabels, Scope.ArabicNumerals, Scope.Base10]);
            expect(evaluated.assessments.find(item => item.facet === 'numberKind')?.status).toBe('satisfied');
            expect(evaluated.assessments.filter(item => ['operandCount', 'operandDigits'].includes(item.facet))).toEqual([]);
            const stub = new AlgebraExpressionsGenerator().generate(resolved.config)!;
            const literals = (node: AlgebraicExpressionProblem['expression']): number[] => node.kind === 'number'
                ? node.value.denominator === 1 ? [node.value.numerator] : []
                : node.kind === 'binary' ? [...literals(node.left), ...literals(node.right)]
                    : node.kind === 'group' ? literals(node.expression)
                        : node.kind === 'negation' ? literals(node.operand)
                            : node.kind === 'power' ? literals(node.base) : [];
            expect(literals(stub.data.structuralExpression.expression).length).toBeGreaterThan(0);
        }
    });

    it('completes the actual symbolic quotient route in matching, direct and planned resolution without changing mathematics or entropy', () => {
        const target = [...activeTargets, ...implementationTodos].find(item => item.id === '6.EE.A.2b-identify-expression-parts~2757a785')!;
        expect(target).toBeDefined();
        const result = plan(target.id, target.labels, viewEntries[1]);
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        const selections = enumerateDependencyAuditSelections(result.plan).selections;
        expect(selections).toHaveLength(1);
        expect(selections[0].labels.filter(label => numericProfileLabels.includes(label as never)))
            .toEqual([Scope.NumbersWithoutZero]);
        expect(plan('explicit-quotient-zero-absence', [...target.labels, Scope.NumbersWithoutZero], viewEntries[1]).supported).toBe(true);
        for (const claim of [Scope.NumbersWithZero, Scope.NumbersWithoutNegatives, Scope.NumbersWithNegatives]) {
            expect(plan(`unsupported-quotient-${claim}`, [...target.labels, claim], viewEntries[1]).supported).toBe(false);
        }
        expect(plan('unsupported-term-zero-absence', [Area.AlgebraicExpression, Area.Term,
            Scope.NumbersWithoutZero, Ability.ConceptClassification], viewEntries[1]).supported).toBe(false);
        const generator = new AlgebraExpressionsGenerator();
        const originalConfig = {relation: 'symbolic-quotient', power: 'none', numericProfile: 0} as const;
        for (let seed = 0; seed < 32; seed++) {
            setSeed(seed); const originalState = getRandomState();
            const originalStub = generator.generate(originalConfig)!;
            const continuation = getRandomState();
            for (const labels of [target.labels, [...target.labels, Scope.NumbersWithoutZero]]) {
                setSeed(seed);
                const direct = extractConfig(AlgebraExpressionsGeneratorSchema, labels);
                expect(direct.config).toEqual(originalConfig);
                expect(direct.resolvedLabels).toContain(Scope.NumbersWithoutZero);
                expect(getRandomState()).toBe(originalState);
                expect(generator.generate(direct.config)).toEqual(originalStub);
                expect(getRandomState()).toBe(continuation);
            }
            const input = {generatorSchema: AlgebraExpressionsGeneratorSchema, viewSchema: partsSchema, plan: result.plan,
                sampleKey: `${target.id}#${spec.generatorId}#${parts.viewId}#train#question#inst:0`, seed, attempt: 1};
            const resolved = resolvePlannedConfigurations(input);
            expect(resolved.generatorConfig).toEqual(originalConfig);
            expect(resolved.generatorRandomState).toBe(originalState);
            const draw = generatePlannedDraw({...input, generator});
            expect(draw.stub!.data).toEqual(originalStub.data);
            expect(getRandomState()).toBe(continuation);
            expect(originalStub.data.restrictions).toEqual([
                {kind: 'nonzero-expression', expressionNodeId: 'input-group', reason: 'division-denominator'}
            ]);
            const expression = originalStub.data.structuralExpression.expression;
            expect(expression.kind).toBe('binary');
            if (expression.kind !== 'binary' || expression.left.kind !== 'number') throw new Error('Expected literal numerator');
            expect(expression.operation).toBe('division');
            expect(expression.left.value.numerator).toBeGreaterThan(0);
            expect(expression.left.value.denominator).toBe(1);
            expect(expression.right).toMatchObject({kind: 'group', expression: {kind: 'variable'}});
        }
    });

    it('keeps explicit broad RationalNumbers requests on their original exact-rational relations', () => {
        const requested = [Scope.RationalNumbers];
        const result = planCompatibility({identity: {targetId: 'rational-context', generatorId: spec.generatorId, viewId: 'proof'},
            targetLabels: requested, generatorLabels: [], viewLabels: [], generatorRules: spec.compatibility,
            fields: normalizeSchemaChoices(AlgebraExpressionsGeneratorSchema, requested, 'generator')});
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        for (const selection of enumerateDependencyAuditSelections(result.plan).selections) {
            expect(selection.labels).toContain(Scope.RationalNumbers);
            expect(selection.labels).not.toContain(Scope.IntegerNumbers);
        }
        for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const resolved = extractConfig(AlgebraExpressionsGeneratorSchema, requested);
            expect(resolved.resolvedLabels).toContain(Scope.RationalNumbers);
            expect(resolved.config.relation?.startsWith('symbolic-')).toBe(false);
        }
        expect(() => extractConfig(AlgebraExpressionsGeneratorSchema,
            [Area.AlgebraicExpression, Area.Factor, Area.Coefficient])).toThrow(/Unsupported exact label combination/);
    });

    it('does not let a prescribed phrase acquire hidden fallback structural or modeling claims', () => {
        const labels = [Area.AlgebraicExpression, Scope.ArabicNumerals, Ability.Formalization, Ability.TextualReception];
        const result = plan('prescribed-phrase', labels, viewEntries[0]);
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        expect(result.plan.domains.filter(domain => domain.owner === 'generator').map(domain => domain.alternatives.length)).toEqual([2, 1, 1]);
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
