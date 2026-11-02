import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {IntegerAddSubtractStrategiesGenerator} from '../generators/arithmetic/integer-add-subtract-strategies/generator.ts';
import {PlaceValueExpandedGenerator} from '../generators/place-value/place-value-expanded/generator.ts';
import {spec as strategyView} from '../visuals/views/operations/operations-add-subtract-strategy-understanding/spec.ts';
import {spec as expandedView} from '../visuals/views/place-value/place-value-expanded-form/spec.ts';
import {createGenerationSelectionReceipt, planCompatibility} from './compatibility.ts';
import {normalizeSchemaChoices} from './schema-choices.ts';
import {enumerateDependencyAuditSelections} from './label-dependency-audit.ts';
import {resolveDependencyAuditAnnotation} from './label-dependency-annotation-resolution.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from './planned-generation.ts';
import {getRandomState} from './random.ts';
import {extractSchemaLabels} from './utils.ts';
import type {ProblemGenerator} from '../types/ml-engine.ts';
import type {ViewSpec} from '../types/view-spec.ts';
import type {AnyGeneratorSpec, GeneratorSpec} from '../types/generator-spec.ts';
import {planModelCompatibility} from './model-compatibility.ts';

const cases: {name: string; generator: ProblemGenerator & {spec: AnyGeneratorSpec};
    view: ViewSpec; targetLabels: string[]; expected: string; facet: string}[] = [
    ...[Scope.NumbersSmaller1000, Scope.NumbersSmaller1000000].flatMap(range =>
        [Scope.TwoOperands, Scope.ThreeOperands].map(count => ({
            name: `expanded form ${range} ${count}`, generator: new PlaceValueExpandedGenerator(), view: expandedView,
            targetLabels: [Area.PlaceValue, Area.Sum, range, count],
            expected: range === Scope.NumbersSmaller1000 ? Scope.NumbersWithoutZero : Scope.NumbersWithZero, facet: 'zero'
        })))
];

describe('four expanded-form configuration inference acceptance cases', () => {
    it.each(cases)('proves $name and preserves planned draws in both modes', ({generator, view, targetLabels, expected, facet}) => {
        const spec = generator.spec;
        const baseSpec = {...spec, inferredLabels: undefined};
        const identity = {targetId: 'inference-acceptance', generatorId: spec.generatorId, viewId: view.viewId};
        const planned = planCompatibility({identity, targetLabels, generatorLabels: spec.generalLabels,
            viewLabels: view.generalLabels, generatorRules: spec.compatibility,
            fields: normalizeSchemaChoices(generator.schema, targetLabels, 'generator')});
        if (!planned.supported) throw new Error(planned.reason);
        const plan = planned.plan;
        const originalPlan = structuredClone(plan);
        const selections = enumerateDependencyAuditSelections(plan);
        expect(selections.status).toBe('complete');
        expect(selections.selections.length).toBeGreaterThan(0);
        const evaluator = createLabelDependencyEvaluator();
        // Canonical lower bands create several valid bindings for the same upper request.
        // Prove annotation-only inference independently for every admitted binding.
        for (const selection of selections.selections) {
            expect(evaluator.evaluate(selection.labels).assessments).toContainEqual(expect.objectContaining({facet, status: 'missing'}));
            const resolved = resolveDependencyAuditAnnotation({id: 'same-selection', plan, selection,
                generator: {schema: generator.schema, spec}, view: {schema: {}, spec: view}});
            expect(resolved.annotationResolution).toMatchObject({status: 'exhaustive', outcome: {
                parentSelectionId: 'same-selection', inferredLabels: [expected]
            }});
            expect(resolved.declaredLabels).toEqual(selection.labels);
            expect(evaluator.evaluate(resolved.labels).assessments).not.toContainEqual(expect.objectContaining({facet, status: 'missing'}));
            expect(evaluator.evaluate(resolved.labels).conflicts).toEqual([]);
            // These zero claims remain supplementary annotations rather than matching capabilities.
            if (facet === 'zero') expect(extractSchemaLabels(generator.schema)).not.toContain(expected);
            for (const mode of ['question', 'solution']) {
                const sampleKey = `${identity.targetId}#${identity.generatorId}#${identity.viewId}#train#${mode}#inst:0`;
                const replay = {version: 1 as const, sampleKey, seed: 39, attempt: 1,
                    selection: createGenerationSelectionReceipt(plan, selection.choices)};
                const input = {generator, viewSchema: {}, viewSpec: view, plan,
                    sampleKey, seed: 39, attempt: 1, replay};
                const plainConfig = resolvePlannedConfigurations({...input, generatorSchema: generator.schema, generatorSpec: baseSpec});
                const inferredConfig = resolvePlannedConfigurations({...input, generatorSchema: generator.schema, generatorSpec: spec});
                expect(inferredConfig.generatorConfig).toEqual(plainConfig.generatorConfig);
                expect(inferredConfig.generatorRandomState).toBe(plainConfig.generatorRandomState);
                expect(inferredConfig.view).toEqual(plainConfig.view);
                const plain = generatePlannedDraw({...input, generatorSpec: baseSpec});
                const continuation = getRandomState();
                const enriched = generatePlannedDraw(input);
                expect(enriched.stub).not.toBeNull();
                expect(enriched.stub?.data).toEqual(plain.stub?.data);
                expect(enriched.view).toEqual(plain.view);
                expect(getRandomState()).toBe(continuation);
                expect(enriched.replay).toEqual(plain.replay);
                expect(enriched.labels).toEqual([...plain.labels, expected].sort());
                expect(generatePlannedDraw({...input, replay: enriched.replay})).toEqual(enriched);
            }
        }
        expect(plan).toEqual(originalPlan);
    });
});

describe('near-double acceptance cases migrated to matching-capable declarations', () => {
    it.each([Scope.NumbersSmaller10, Scope.NumbersSmaller20])('declares and replays the width for %s without inference', range => {
        const generator = new IntegerAddSubtractStrategiesGenerator();
        const spec = generator.spec;
        const targetLabels = [Area.AdditionNearDoubles, range, Scope.SingleDigitSmallestOperand, ...strategyView.generalLabels];
        const planned = planModelCompatibility({id: 'declared-width-acceptance', labels: targetLabels},
            {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema, spec},
            {viewId: strategyView.viewId, generalLabels: strategyView.generalLabels, schema: {}, spec: strategyView});
        if (!planned.supported) throw new Error(planned.reason);
        expect(spec.inferredLabels).toBeUndefined();
        const selections = enumerateDependencyAuditSelections(planned.plan);
        expect(selections.selections).toHaveLength(1);
        const selection = selections.selections[0]!;
        expect(selection.labels).toContain(Scope.SingleDigitSmallestOperand);
        const annotation = resolveDependencyAuditAnnotation({id: 'declared-width-selection', plan: planned.plan, selection,
            generator: {schema: generator.schema, spec}, view: {schema: {}, spec: strategyView}});
        expect(annotation.annotationResolution.status).toBe('not_required');
        expect(annotation.labels).toEqual(selection.labels);
        for (const mode of ['question', 'solution']) {
            const input = {generator, generatorSpec: spec, viewSchema: {}, viewSpec: strategyView, plan: planned.plan,
                sampleKey: `declared-width-acceptance#${spec.generatorId}#${strategyView.viewId}#train#${mode}#inst:0`, seed: 39, attempt: 1};
            const draw = generatePlannedDraw(input);
            expect(draw.labels).toContain(Scope.SingleDigitSmallestOperand);
            expect(Math.min(draw.stub!.data.leftOperand, draw.stub!.data.rightOperand)).toBeLessThan(10);
            expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
        }
    });
});

describe('inferred-only output matching boundary', () => {
    it('keeps advertised outputs outside matching even when exhaustive configuration inference proves them', () => {
        const schema = {operation: [Area.Addition]} as const;
        const output = Scope.SingleDigitSmallestOperand;
        const spec: GeneratorSpec<typeof schema> = {generatorId: 'inferred-only-fixture',
            generalLabels: [Scope.IntegerNumbers, Scope.Base10, Scope.TwoOperands, Scope.NumbersSmaller10,
                Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero],
            inferredLabels: [{produces: [output], infer: ({operation}) => operation === Area.Addition ? [output] : []}]};
        const view: ViewSpec = {viewId: 'inferred-only-fixture-view', generalLabels: []};
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};
        const target = {id: 'inferred-only-fixture-target', labels: [Area.Addition]};
        const planned = planModelCompatibility(target, model, consumer);
        if (!planned.supported) throw new Error(planned.reason);
        expect(planModelCompatibility({...target, labels: [...target.labels, output]}, model, consumer).supported).toBe(false);
        expect(extractSchemaLabels(schema)).not.toContain(output);
        const selection = enumerateDependencyAuditSelections(planned.plan).selections[0]!;
        const annotation = resolveDependencyAuditAnnotation({id: 'inferred-only-selection', plan: planned.plan, selection,
            generator: {schema, spec}, view: {schema: {}, spec: view}});
        expect(annotation.annotationResolution).toMatchObject({status: 'exhaustive', outcome: {inferredLabels: [output]}});
        expect(annotation.labels).toContain(output);
        expect(selection.labels).not.toContain(output);
    });
});
