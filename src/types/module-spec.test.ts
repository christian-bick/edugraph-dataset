import {describe, expect, expectTypeOf, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts/generated';
import type {GeneratorSpec, AnyGeneratorSpec} from './generator-spec.ts';
import type {ViewSpec, AnyViewSpec} from './view-spec.ts';
import type {GeneratorMatchInfo, ViewMatchInfo} from '../lib/matching.ts';
import {matchTargets} from '../lib/matching.ts';
import type {GeneratorModelDescriptor, ViewModelDescriptor} from '../lib/model-catalog.ts';
import {planModelCompatibility, type GeneratorChoiceModel, type ViewChoiceModel} from '../lib/model-compatibility.ts';

describe('schema-typed specs at heterogeneous boundaries', () => {
    it('accepts typed owners without invoking inference or exposing inferred matching capabilities', () => {
        const generatorSchema = {operation: [Area.Addition, Area.Subtraction]} as const;
        const viewSchema = {layout: Object.assign(() => 'compact' as const, {ontologyNeutral: true as const})};
        let generatorCalls = 0;
        let viewCalls = 0;
        const generatorSpec: GeneratorSpec<typeof generatorSchema> = {
            generatorId: 'typed-generator', generalLabels: [], inferredLabels: [{
                produces: [Scope.IntegerNumbers], infer: config => {
                    generatorCalls++;
                    expectTypeOf(config.operation).toEqualTypeOf<typeof Area.Addition | typeof Area.Subtraction>();
                    if (false) {
                        // @ts-expect-error Erasure at a catalog boundary does not weaken authored callback inputs.
                        config.operation = Area.Addition;
                    }
                    return config.operation === Area.Addition ? [Scope.IntegerNumbers] : [];
                }
            }]
        };
        const viewSpec: ViewSpec<typeof viewSchema> = {
            viewId: 'typed-view', generalLabels: [], inferredLabels: [{
                produces: [Scope.ArabicNumerals], infer: config => {
                    viewCalls++;
                    expectTypeOf(config.layout).toEqualTypeOf<'compact'>();
                    return config.layout === 'compact' ? [Scope.ArabicNumerals] : [];
                }
            }]
        };
        const erasedGenerator: AnyGeneratorSpec = generatorSpec;
        const erasedView: AnyViewSpec = viewSpec;
        expectTypeOf(erasedGenerator.generatorId).toEqualTypeOf<string>();
        expectTypeOf(erasedView.viewId).toEqualTypeOf<string>();
        const generator: GeneratorMatchInfo = {generatorId: generatorSpec.generatorId,
            labels: [...generatorSchema.operation], problemType: 'CountingProblem', schema: generatorSchema, spec: generatorSpec};
        const view: ViewMatchInfo = {viewId: viewSpec.viewId,
            supportedLabels: [], problemType: 'CountingProblem', schema: viewSchema, spec: viewSpec};
        const module = {id: 'typed', relativePath: 'typed', absolutePath: '/typed', category: null};
        const generatorModel: GeneratorModelDescriptor = {...generator, module, generalLabels: [], spec: generatorSpec};
        const viewModel: ViewModelDescriptor = {...view, module, generalLabels: [], schema: viewSchema, spec: viewSpec};
        const generatorChoice: GeneratorChoiceModel = {...generator, generalLabels: [], spec: generatorSpec};
        const viewChoice: ViewChoiceModel = {...view, generalLabels: [], schema: viewSchema, spec: viewSpec};
        const target = {id: 'typed', labels: [Area.Addition]};
        expect(planModelCompatibility(target, generatorChoice, viewChoice).supported).toBe(true);
        expect(matchTargets([target], [generatorModel], [viewModel]).tuples).toHaveLength(1);
        for (const inferred of [Scope.IntegerNumbers, Scope.ArabicNumerals]) {
            expect(matchTargets([{...target, labels: [...target.labels, inferred]}], [generator], [view]).tuples).toEqual([]);
        }
        expect(generatorCalls).toBe(0);
        expect(viewCalls).toBe(0);
    });
});
