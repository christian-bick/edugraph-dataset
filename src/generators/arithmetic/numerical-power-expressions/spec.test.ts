import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import type {ExactPowerFact} from '../../../types/problems.ts';
import {spec as evaluationView, NumericalPowerExpressionEvaluateViewSchema} from '../../../visuals/views/operations/numerical-power-expression-evaluate/spec.ts';
import {spec as writingView, NumericalPowerExpressionWriteViewSchema} from '../../../visuals/views/operations/numerical-power-expression-write/spec.ts';
import {NumericalPowerExpressionsGenerator} from './generator.ts';
import {NumericalPowerExpressionsGeneratorSchema, spec} from './spec.ts';

describe('exact expression structure/exponent capability bundles', () => {
    it('owns precisely the reviewed invariants and two genuine mathematical choices', () => {
        expect(spec.generalLabels).toEqual([Area.ArithmeticExpression, Area.Exponentiation, Scope.IntegerExponent]);
        expect(Object.keys(NumericalPowerExpressionsGeneratorSchema)).toEqual(['structure', 'exponents']);
        expect(NumericalPowerExpressionsGeneratorSchema.structure[2]).toEqual([[], [Area.OrderOfOperations]]);
        expect(NumericalPowerExpressionsGeneratorSchema.exponents[2]).toEqual([[], [Scope.PositiveExponent]]);
        expect(findSchemaFallbackContractIssues(NumericalPowerExpressionsGeneratorSchema)).toEqual([]);
        for (const [structureLabels, structure] of [[[], 'single-power'], [[Area.OrderOfOperations], 'mixed-precedence']] as const) {
            for (const [exponentLabels, exponents] of [[[], 'allow-zero'], [[Scope.PositiveExponent], 'positive']] as const) {
                const labels = [...structureLabels, ...exponentLabels];
                const resolved = extractConfig(NumericalPowerExpressionsGeneratorSchema, labels);
                expect(resolved.config).toEqual({structure, exponents});
                expect(new Set(resolved.resolvedLabels)).toEqual(new Set(labels));
                const data = generateWithLabels(new NumericalPowerExpressionsGenerator(), labels)!.data;
                expect(data.precedenceWitness === null).toBe(structure === 'single-power');
                if (exponents === 'positive') expect(data.powerFacts.every(fact => fact.exponent > 0)).toBe(true);
            }
        }
    });

    it('executes all four real authored plans with exact claims and actual fixed-view declarations', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target => target.id.startsWith('6.EE.A.1-evaluate-power-expressions~')
            || target.id.startsWith('6.EE.A.1-write-power-expressions~'));
        expect(targets).toHaveLength(4);
        for (const target of targets) {
            const writing = target.labels.includes(Ability.Formalization);
            const view = writing ? writingView : evaluationView;
            const viewSchema = writing ? NumericalPowerExpressionWriteViewSchema : NumericalPowerExpressionEvaluateViewSchema;
            const result = planCompatibility({identity: {targetId: target.id, generatorId: spec.generatorId, viewId: view.viewId},
                targetLabels: target.labels, generatorLabels: spec.generalLabels, viewLabels: view.generalLabels,
                generatorRules: spec.compatibility, viewRules: view.compatibility,
                fields: [...normalizeSchemaChoices(NumericalPowerExpressionsGeneratorSchema, target.labels, 'generator'),
                    ...normalizeSchemaChoices(viewSchema, target.labels, 'view')]});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            for (let seed = 0; seed < 16; seed++) {
                const draw = generatePlannedDraw({generator: new NumericalPowerExpressionsGenerator(), viewSchema, plan: result.plan,
                    sampleKey: `${target.id}#${spec.generatorId}#${view.viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                expect(draw.stub!.data.precedenceWitness === null).toBe(writing);
                if (target.labels.includes(Scope.PositiveExponent)) expect(draw.stub!.data.powerFacts.every((fact: ExactPowerFact) => fact.exponent > 0)).toBe(true);
            }
        }
    });

    it('rejects a future written-order claim at the writer without narrowing its uniform payload type', () => {
        const labels = [Area.ArithmeticExpression, Area.Exponentiation, Area.OrderOfOperations, Scope.IntegerExponent,
            Scope.ArabicNumerals, Ability.Formalization, Ability.TextualReception];
        const result = planCompatibility({identity: {targetId: 'future-prescribed-mixed-expression', generatorId: spec.generatorId, viewId: writingView.viewId},
            targetLabels: labels, generatorLabels: spec.generalLabels, viewLabels: writingView.generalLabels, viewRules: writingView.compatibility,
            fields: normalizeSchemaChoices(NumericalPowerExpressionsGeneratorSchema, labels, 'generator')});
        expect(result.supported).toBe(false);
    });

    it('keeps canonical mathematics Ability neutral and throws for unbound config', () => {
        const labels = [Area.OrderOfOperations, Scope.PositiveExponent];
        setSeed(23); const first = generateWithLabels(new NumericalPowerExpressionsGenerator(), [...labels, Ability.ProcedureExecution]);
        setSeed(23); expect(generateWithLabels(new NumericalPowerExpressionsGenerator(), [...labels, Ability.Interpretation])).toEqual(first);
        expect(() => new NumericalPowerExpressionsGenerator().generate({})).toThrow();
    });
});
