import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {StatisticalGraphsGenerator} from '../../../generators/statistics/statistical-graphs/generator.ts';
import {spec as generatorSpec, StatisticalGraphsGeneratorSchema} from '../../../generators/statistics/statistical-graphs/spec.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {sampleGenerationPlan} from '../../../lib/compatibility.ts';
import {bindingsForSelection} from '../../../lib/planned-generation.ts';
import {random, setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {BarGraphViewSchema} from './bar-graph-spec.ts';
import {spec as construction} from './data-bar-graph/spec.ts';
import {spec as arithmetic} from './data-bar-graph-arithmetic/spec.ts';
import {spec as classification} from './data-bar-graph-classification/spec.ts';
import {spec as interpretation} from './data-bar-graph-interpretation/spec.ts';
import {spec as picture, DataPictureGraphViewSchema} from './data-picture-graph/spec.ts';

const producer = {
    generatorId: generatorSpec.generatorId, generalLabels: generatorSpec.generalLabels,
    schema: StatisticalGraphsGeneratorSchema, spec: generatorSpec
};
const scales = [
    {scale: 1, quantityLabels: [], step: Scope.StepsOf1},
    {scale: 2, quantityLabels: [Scope.EvenNumbers], step: Scope.StepsOf2},
    {scale: 5, quantityLabels: [Scope.MultiplesOf5], step: Scope.StepsOf5},
    {scale: 10, quantityLabels: [Scope.MultiplesOf10], step: Scope.StepsOf10}
] as const;
const stepLabels = scales.map(({step}) => step);

describe('graph quantity and axis ownership', () => {
    it.each([construction, arithmetic, classification, interpretation].flatMap(spec =>
        scales.map(scale => ({...scale, spec, viewId: spec.viewId}))))(
        'binds $viewId axis step $scale to its quantity constraint', ({scale, quantityLabels, step, spec}) => {
            const target = {id: 'graph-axis', labels: [Area.Statistics, ...quantityLabels, step, ...spec.generalLabels,
                ...(spec === arithmetic ? [Area.Subtraction, Scope.SingleStep] : [])]};
            const view = {viewId: spec.viewId, generalLabels: spec.generalLabels, schema: BarGraphViewSchema, spec};
            const result = planModelCompatibility(target, producer, view);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);

            for (let seed = 0; seed < 16; seed++) {
                setSeed(seed);
                const selection = bindingsForSelection(result.plan, sampleGenerationPlan(result.plan, random));
                const generated = resolveSchemaChoices(StatisticalGraphsGeneratorSchema, target.labels, selection.generator);
                const rendered = resolveSchemaChoices(BarGraphViewSchema, target.labels, selection.view);
                const data = new StatisticalGraphsGenerator().generate(generated.config).data;
                expect(data.scale).toBe(scale);
                expect(generated.resolvedLabels).toEqual(expect.arrayContaining([...quantityLabels]));
                expect(generated.resolvedLabels.some(label => stepLabels.includes(label as typeof step))).toBe(false);
                expect(rendered.resolvedLabels).toEqual([step]);
                expect(rendered.config.axisStep).toBe(scale);
            }

            const wrongStep = scale === 1 ? Scope.StepsOf2 : Scope.StepsOf1;
            const mismatched = {...target, labels: target.labels.map(label => label === step ? wrongStep : label)};
            expect(planModelCompatibility(mismatched, producer, view).supported).toBe(false);
        }
    );

    it.each(scales)('admits scale $scale picture graphs without claiming a sequence', ({scale, quantityLabels, step}) => {
        const view = {viewId: picture.viewId, generalLabels: picture.generalLabels, schema: DataPictureGraphViewSchema, spec: picture};
        const target = {id: 'picture-scale', labels: [Area.Statistics, ...quantityLabels, ...picture.generalLabels]};
        const result = planModelCompatibility(target, producer, view);
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        const choices = bindingsForSelection(result.plan, sampleGenerationPlan(result.plan, () => 0.999));
        const generated = resolveSchemaChoices(StatisticalGraphsGeneratorSchema, target.labels, choices.generator);
        expect(new StatisticalGraphsGenerator().generate(generated.config).data.scale).toBe(scale);
        expect(generated.resolvedLabels).toEqual(quantityLabels);
        expect(planModelCompatibility({...target, labels: [...target.labels, step]}, producer, view).supported).toBe(false);
    });
});
