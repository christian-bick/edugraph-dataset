import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {StatisticalGraphsGenerator} from '../../../generators/statistics/statistical-graphs/generator.ts';
import {spec as generatorSpec, StatisticalGraphsGeneratorSchema} from '../../../generators/statistics/statistical-graphs/spec.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {sampleGenerationPlan} from '../../../lib/compatibility.ts';
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

describe('bar-graph scale ownership', () => {
    it.each([construction, arithmetic, classification, interpretation])(
        'binds $viewId five-step axes to five-multiple quantities', spec => {
            const target = {id: 'five-step-axis', labels: [Area.Statistics, Scope.StepsOf5, ...spec.generalLabels]};
            const view = {viewId: spec.viewId, generalLabels: spec.generalLabels, schema: BarGraphViewSchema, spec};
            const result = planModelCompatibility(target, producer, view);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);

            for (let seed = 0; seed < 16; seed++) {
                setSeed(seed);
                const selection = {generator: {}, view: {}} as Record<'generator' | 'view', Record<string, readonly string[]>>;
                for (const choice of sampleGenerationPlan(result.plan, random).choices) {
                    const domain = result.plan.domains.find(domain => domain.owner === choice.owner && domain.field === choice.field)!;
                    selection[choice.owner][choice.field] = domain.alternatives.find(option => option.id === choice.alternativeId)!.labels;
                }
                const generated = resolveSchemaChoices(StatisticalGraphsGeneratorSchema, target.labels, selection.generator);
                const rendered = resolveSchemaChoices(BarGraphViewSchema, target.labels, selection.view);
                const data = new StatisticalGraphsGenerator().generate(generated.config).data;
                expect(data.scale).toBe(5);
                expect(generated.resolvedLabels).toContain(Scope.MultiplesOf5);
                expect(generated.resolvedLabels).not.toContain(Scope.StepsOf5);
                expect(rendered.resolvedLabels).toContain(Scope.StepsOf5);
                expect(rendered.config.requireFiveStepAxis).toBe(true);
            }

            expect(planModelCompatibility({...target, labels: [...target.labels, Scope.StepsOf2]}, producer, view).supported)
                .toBe(false);
        }
    );

    it('admits five-multiple picture graphs without claiming an ordered sequence', () => {
        const view = {viewId: picture.viewId, generalLabels: picture.generalLabels, schema: DataPictureGraphViewSchema, spec: picture};
        const target = {id: 'picture-scale', labels: [Area.Statistics, Scope.MultiplesOf5, ...picture.generalLabels]};
        expect(planModelCompatibility(target, producer, view).supported).toBe(true);
        expect(planModelCompatibility({...target, labels: [...target.labels, Scope.StepsOf5]}, producer, view).supported).toBe(false);
    });
});
