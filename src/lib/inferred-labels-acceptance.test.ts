import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {IntegerAddSubtractStrategiesGenerator} from '../generators/arithmetic/integer-add-subtract-strategies/generator.ts';
import {PlaceValueExpandedGenerator} from '../generators/place-value/place-value-expanded/generator.ts';
import {spec as strategyView} from '../visuals/views/operations/operations-add-subtract-strategy-understanding/spec.ts';
import {spec as expandedView} from '../visuals/views/place-value/place-value-expanded-form/spec.ts';
import {planCompatibility} from './compatibility.ts';
import {normalizeSchemaChoices} from './schema-choices.ts';
import {enumerateDependencyAuditSelections} from './label-dependency-audit.ts';
import {resolveDependencyAuditAnnotation} from './label-dependency-annotation-resolution.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from './planned-generation.ts';
import {getRandomState} from './random.ts';
import {extractSchemaLabels} from './utils.ts';
import type {ProblemGenerator} from '../types/ml-engine.ts';
import type {AnyModuleSpec} from '../types/module-spec.ts';
import type {ViewSpec} from '../types/view-spec.ts';

const cases: {name: string; generator: ProblemGenerator & {spec: AnyModuleSpec & {generatorId: string}};
    view: ViewSpec; targetLabels: string[]; expected: string; facet: string}[] = [
    ...[Scope.NumbersSmaller10, Scope.NumbersSmaller20].map(range => ({
        name: `near doubles ${range}`, generator: new IntegerAddSubtractStrategiesGenerator(), view: strategyView,
        targetLabels: [Area.AdditionNearDoubles, range], expected: Scope.SingleDigitSmallestOperand, facet: 'operandDigits'
    })),
    ...[Scope.NumbersSmaller1000, Scope.NumbersSmaller1000000].flatMap(range =>
        [Scope.TwoOperands, Scope.ThreeOperands].map(count => ({
            name: `expanded form ${range} ${count}`, generator: new PlaceValueExpandedGenerator(), view: expandedView,
            targetLabels: [Area.PlaceValue, Area.Sum, range, count],
            expected: range === Scope.NumbersSmaller1000 ? Scope.NumbersWithoutZero : Scope.NumbersWithZero, facet: 'zero'
        })))
];

describe('six configuration inference acceptance cases', () => {
    it.each(cases)('proves $name and preserves planned draws in both modes', ({generator, view, targetLabels, expected, facet}) => {
        const spec = generator.spec;
        const baseSpec = {generalLabels: spec.generalLabels};
        const identity = {targetId: 'inference-acceptance', generatorId: spec.generatorId, viewId: view.viewId};
        const planned = planCompatibility({identity, targetLabels, generatorLabels: spec.generalLabels,
            viewLabels: view.generalLabels, fields: normalizeSchemaChoices(generator.schema, targetLabels, 'generator')});
        if (!planned.supported) throw new Error(planned.reason);
        const plan = planned.plan;
        const originalPlan = structuredClone(plan);
        const selections = enumerateDependencyAuditSelections(plan);
        expect(selections.status).toBe('complete');
        expect(selections.selections).toHaveLength(1);
        const selection = selections.selections[0];
        const evaluator = createLabelDependencyEvaluator();
        expect(evaluator.evaluate(selection.labels).assessments).toContainEqual(expect.objectContaining({facet, status: 'missing'}));
        const resolved = resolveDependencyAuditAnnotation({id: 'same-selection', plan, selection,
            generator: {schema: generator.schema, spec}, view: {schema: {}, spec: view}});
        expect(resolved.annotationResolution).toMatchObject({status: 'exhaustive', outcome: {
            parentSelectionId: 'same-selection', inferredLabels: [expected]
        }});
        expect(resolved.declaredLabels).toEqual(selection.labels);
        expect(evaluator.evaluate(resolved.labels).assessments).not.toContainEqual(expect.objectContaining({facet, status: 'missing'}));
        expect(evaluator.evaluate(resolved.labels).conflicts).toEqual([]);
        // The existing make-ten choice already owns its width capability; inference adds no new catalog entries.
        if (facet === 'zero') expect(extractSchemaLabels(generator.schema)).not.toContain(expected);
        for (const mode of ['question', 'solution']) {
            const input = {generator, viewSchema: {}, viewSpec: view, plan,
                sampleKey: `${identity.targetId}#${identity.generatorId}#${identity.viewId}#train#${mode}#inst:0`, seed: 39, attempt: 1};
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
        expect(plan).toEqual(originalPlan);
    });
});
