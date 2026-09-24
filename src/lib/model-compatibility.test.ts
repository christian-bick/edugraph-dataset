import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {planModelCompatibility, type GeneratorChoiceModel, type ViewChoiceModel} from './model-compatibility.ts';
import {sampleGenerationPlan, validateGenerationPlan} from './compatibility.ts';
import {resolveSchemaChoices, type SchemaChoiceSelection} from './schema-choices.ts';
import {random, setSeed} from './random.ts';
import {spec as generatorSpec, MeasurementDataGeneratorSchema} from '../generators/statistics/measurement-data/spec.ts';
import {spec as viewSpec, MeasurementLinePlotViewSchema} from '../visuals/views/data/measurement-line-plot/spec.ts';
import {MeasurementDataGenerator} from '../generators/statistics/measurement-data/generator.ts';
import type {GenerationPlan} from '../types/compatibility.ts';

const generator: GeneratorChoiceModel = {
    generatorId: generatorSpec.generatorId,
    generalLabels: generatorSpec.generalLabels,
    schema: MeasurementDataGeneratorSchema,
    spec: {...generatorSpec, compatibility: [{
        id: 'single-frame-fractions',
        dependencies: [
            {scope: 'generator', label: Scope.SingleFrameOfReference},
            {scope: 'generator', label: Scope.FractionNumbers}
        ],
        predicate: labels => !labels.has('generator', Scope.SingleFrameOfReference)
            || labels.has('generator', Scope.FractionNumbers)
    }]}
};
const view: ViewChoiceModel = {
    viewId: viewSpec.viewId,
    generalLabels: viewSpec.generalLabels,
    schema: MeasurementLinePlotViewSchema,
    spec: {...viewSpec, compatibility: [{
        id: 'unit-step-whole-measurements',
        dependencies: [
            {scope: 'view', label: Scope.StepsOf1},
            {scope: 'generator', label: Scope.IntegerNumbers}
        ],
        predicate: labels => !labels.has('view', Scope.StepsOf1)
            || labels.has('generator', Scope.IntegerNumbers)
    }]}
};

function selected(plan: GenerationPlan): {generator: SchemaChoiceSelection; view: SchemaChoiceSelection} {
    const receipt = sampleGenerationPlan(plan, random);
    const result: {generator: Record<string, readonly string[]>; view: Record<string, readonly string[]>} = {generator: {}, view: {}};
    for (const choice of receipt.choices) {
        const domain = plan.domains.find(domain => domain.owner === choice.owner && domain.field === choice.field)!;
        result[choice.owner][choice.field] = domain.alternatives.find(option => option.id === choice.alternativeId)!.labels;
    }
    return result;
}

describe('metadata model compatibility', () => {
    it.each([
        [[Scope.StepsOf1, Scope.IntegerNumbers], 'integer'],
        [[Scope.StepsOf1], 'integer'],
        [[Scope.SingleFrameOfReference], 'fraction'],
        [[Scope.SingleFrameOfReference, Scope.FractionNumbers], 'fraction']
    ] as const)('constrains each actual draw for %j', (requested, numberKind) => {
        const target = {id: 'measurement-regression', labels: [Area.Statistics, ...requested]};
        const result = planModelCompatibility(target, generator, view, 'source-and-ontology-inputs');
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        const plan = validateGenerationPlan(JSON.parse(JSON.stringify(result.plan)));
        const implementation = new MeasurementDataGenerator();
        for (let seed = 1; seed <= 64; seed++) {
            setSeed(seed);
            const choices = selected(plan);
            const generated = resolveSchemaChoices(MeasurementDataGeneratorSchema, target.labels, choices.generator);
            const rendered = resolveSchemaChoices(MeasurementLinePlotViewSchema, target.labels, choices.view);
            expect(generated.config.numberKind).toBe(numberKind);
            const stub = implementation.generate(generated.config);
            if (rendered.config.usesUnitSteps) expect(stub.data.subdivisions).toBe(1);
            if (generated.config.useSingleFrame) expect(stub.data.subdivisions).toBe(8);
        }
        expect(target.labels).toEqual([Area.Statistics, ...requested]);
    });

    it.each([
        [Scope.StepsOf1, Scope.FractionNumbers],
        [Scope.SingleFrameOfReference, Scope.IntegerNumbers],
        [Scope.SingleFrameOfReference, Scope.StepsOf1]
    ])('rejects contradictory requests before any generation: %j', (...labels) => {
        const result = planModelCompatibility({id: 'contradiction', labels}, generator, view);
        expect(result.supported).toBe(false);
        if (result.supported) throw new Error('Expected unsupported');
        expect(result.reason).toBe('incompatible-rules');
    });

    it('retains both number kinds when no unit-step or single-frame constraint applies', () => {
        const result = planModelCompatibility({id: 'unrestricted', labels: [Area.Statistics]}, generator, view);
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        expect(result.plan.domains.find(domain => domain.field === 'numberKind')!.alternatives)
            .toHaveLength(2);
    });

    it('does not satisfy a required target policy with a fallback-selected capability', () => {
        const requiresIntegers = {...view, spec: {...view.spec, requiredLabels: [Scope.IntegerNumbers]}};
        const result = planModelCompatibility({id: 'not-requested', labels: [Scope.StepsOf1]}, generator, requiresIntegers);
        expect(result.supported).toBe(false);
        if (result.supported) throw new Error('Expected unsupported');
        expect(result.ruleIds).toContain('view:legacy.requiredLabels');
    });

    it('adapts ontology-aware target rejections without treating them as capabilities', () => {
        const rejectsIntegers = {...view, spec: {...view.spec, rejectedLabels: [Scope.IntegerNumbers]}};
        const result = planModelCompatibility({id: 'rejected', labels: [Scope.IntegerNumbers]}, generator, rejectsIntegers);
        expect(result.supported).toBe(false);
        if (result.supported) throw new Error('Expected unsupported');
        expect(result.ruleIds).toContain('view:legacy.rejectedLabels');
    });
});
