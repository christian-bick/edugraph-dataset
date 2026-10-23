import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {setSeed} from '../../../lib/random.ts';
import {spec as gradeFive} from '../../../spec/ccss/grade-05.ts';
import {spec as gradeSix, implementationTodos} from '../../../spec/ccss/grade-06.ts';
import type {ViewSpec} from '../../../types/view-spec.ts';
import {spec as packingCount} from '../../../visuals/views/measure/volume-fractional-packing-count/spec.ts';
import {spec as packingExplanation} from '../../../visuals/views/measure/volume-packing-product-explanation/spec.ts';
import {spec as productModel} from '../../../visuals/views/measure/volume-product-model/spec.ts';
import {spec as formulaExecution} from '../../../visuals/views/measure/volume-formula-execution/spec.ts';
import {spec as formulaStory} from '../../../visuals/views/measure/volume-formula-story/spec.ts';
import {VolumeRectangularPrismGenerator} from './generator.ts';
import {VolumeRectangularPrismGeneratorSchema, spec} from './spec.ts';

const profileCases = [
    [[Area.MeasuringVolumes, Area.Equation, Scope.CubeScale], 'packing-equivalence'],
    [[Scope.CubeScale, Scope.ThreeOperands], 'triple-product'],
    [[Scope.CubeScale, Scope.ThreeOperands, Area.AssociativeLaw], 'associative-triple-product'],
    [[Area.Equation, Scope.ThreeOperands], 'edge-formula'],
    [[Area.Equation, Scope.TwoOperands], 'base-area-formula']
] as const;

const commonLabels = [
    Area.VolumeCalculation,
    Area.RectangularPrism,
    Area.Multiplication
] as const;
const leaves=[packingCount,packingExplanation,productModel,formulaExecution,formulaStory];
function plan(labels:readonly string[],view:ViewSpec,id='prism-volume') {
    return planCompatibility({identity:{targetId:id,generatorId:spec.generatorId,viewId:view.viewId},targetLabels:labels,
        generatorLabels:spec.generalLabels,viewLabels:view.generalLabels,generatorRules:spec.compatibility,viewRules:view.compatibility,
        fields:[...normalizeSchemaChoices(VolumeRectangularPrismGeneratorSchema,labels,'generator'),...normalizeSchemaChoices({},labels,'view')]});
}

describe('volume-rectangular-prism schema integration', () => {
    it('owns the invariant prism mathematics without an Ability claim', () => {
        expect(spec.generalLabels).toEqual(commonLabels);
        for (const label of Object.values(Ability)) expect(spec.generalLabels).not.toContain(label);
    });

    it.each(profileCases)('resolves exact mathematical profile %s to %s', (labels, relationProfile) => {
        const resolution = extractConfig(VolumeRectangularPrismGeneratorSchema, [...commonLabels, Scope.IntegerNumbers, ...labels]);
        expect(resolution.config.relationProfile).toBe(relationProfile);
        expect(resolution.config.numberDomain).toBe('integer');
        expect(new Set(resolution.resolvedLabels)).toEqual(new Set<string>([...labels,Scope.IntegerNumbers]));
        const generated = generateWithLabels(new VolumeRectangularPrismGenerator(), [...commonLabels, Scope.IntegerNumbers, ...labels])!;
        for (const label of labels) expect(generated.labels).toContain(label);
        expect(generated.data.kind).toBe('rectangular-prism-volume');
    });

    it('resolves all seven authored target permutations without using their Abilities', () => {
        const paths = [
            {labels: [...profileCases[0][0], Ability.ProcedureUnderstanding, Ability.Formalization],
                profile: 'packing-equivalence'},
            {labels: [...profileCases[1][0], Ability.VisualArticulation], profile: 'triple-product'},
            {labels: [...profileCases[2][0], Ability.VisualArticulation], profile: 'associative-triple-product'},
            ...[false, true].flatMap(story => [
                {labels: [...profileCases[3][0], Ability.ProcedureExecution,
                    ...(story ? [Ability.TextualReception] : [])], profile: 'edge-formula'},
                {labels: [...profileCases[4][0], Ability.ProcedureExecution,
                    ...(story ? [Ability.TextualReception] : [])], profile: 'base-area-formula'}
            ])
        ];
        expect(paths).toHaveLength(7);
        for (const {labels, profile} of paths) {
            const config = extractConfig(VolumeRectangularPrismGeneratorSchema, [...commonLabels, Scope.IntegerNumbers, ...labels]);
            expect(config.config.relationProfile).toBe(profile);
            expect(config.config.numberDomain).toBe('integer');
            expect(new Set(config.resolvedLabels)).toEqual(new Set([Scope.IntegerNumbers,...labels.filter(label =>
                !Object.values(Ability).includes(label as typeof Ability[keyof typeof Ability]))]));
        }
    });

    it('rejects an unsupported cube-scale two-operand conjunction', () => {
        expect(() => extractConfig(VolumeRectangularPrismGeneratorSchema, [
            Scope.CubeScale, Scope.TwoOperands
        ])).toThrow();
    });

    it('declares complete number-domain and mathematical-relation alternatives',()=>{
        expect(Object.keys(VolumeRectangularPrismGeneratorSchema)).toEqual(['relationProfile','numberDomain']);
        expect(findSchemaFallbackContractIssues(VolumeRectangularPrismGeneratorSchema)).toEqual([]);
        expect(VolumeRectangularPrismGeneratorSchema.relationProfile[2]).toEqual([[Area.MeasuringVolumes,Scope.CubeScale],...profileCases.map(([labels])=>labels)]);
        expect(VolumeRectangularPrismGeneratorSchema.numberDomain[2]).toEqual([[Scope.IntegerNumbers],[Scope.FractionNumbers]]);
        for(const [numberLabel,numberDomain] of [[Scope.IntegerNumbers,'integer'],[Scope.FractionNumbers,'fractional']] as const) {
            for(const [relations,profile] of [[[Area.MeasuringVolumes,Scope.CubeScale],'packing-count'],...profileCases] as const) {
                const labels=[...commonLabels,numberLabel,...relations,Ability.ProcedureExecution];
                const result=plan(labels,{viewId:'prism-domain-probe',generalLabels:[Ability.ProcedureExecution]});
                expect(result.supported).toBe(numberDomain!=='integer'||profile!=='packing-count');
                if(!result.supported)continue;
                const resolved=resolvePlannedConfigurations({generatorSchema:VolumeRectangularPrismGeneratorSchema,viewSchema:{},plan:result.plan,
                    sampleKey:'prism-volume#volume-rectangular-prism#prism-domain-probe#train#question#inst:0',seed:471,attempt:1});
                expect(resolved.generatorConfig).toEqual({relationProfile:profile,numberDomain});
            }
        }
    });

    it('executes all seven legacy and six new authored plans through their fixed consumer',()=>{
        const old=gradeFive.filter(target=>target.id.startsWith('5.MD.C.5a-')||target.id.startsWith('5.MD.C.5b-'));
        const fresh=[...gradeSix,...implementationTodos].filter(target=>target.id.startsWith('6.G.A.2-fractional-'));
        expect(old).toHaveLength(7);expect(fresh).toHaveLength(6);
        for(const target of [...old,...fresh]) {
            const expected=target.labels.includes(Ability.VisualArticulation)?productModel
                :target.labels.includes(Ability.Formalization)?packingExplanation
                    :target.labels.includes(Area.MeasuringVolumes)?packingCount
                        :target.labels.includes(Ability.TextualReception)?formulaStory:formulaExecution;
            for(const view of leaves) {
                const result=plan(target.labels,view,target.id);
                expect(result.supported,`${target.id} -> ${view.viewId}`).toBe(view===expected);
                if(!result.supported)continue;
                const draw=generatePlannedDraw({generator:new VolumeRectangularPrismGenerator(),viewSchema:{},plan:result.plan,
                    sampleKey:`${target.id}#volume-rectangular-prism#${view.viewId}#train#question#inst:0`,seed:471,attempt:1});
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                expect(draw.stub?.data.kind).toBe(fresh.includes(target)?'fractional-rectangular-prism-volume':'rectangular-prism-volume');
            }
        }
    });

    it('keeps mathematical generation independent of learner Ability',()=>{
        for(const [relations] of [[[Area.MeasuringVolumes,Scope.CubeScale],'packing-count'],...profileCases] as const) {
            const labels=[...commonLabels,Scope.FractionNumbers,...relations];
            setSeed(912);const first=generateWithLabels(new VolumeRectangularPrismGenerator(),[...labels,Ability.ProcedureExecution]);
            setSeed(912);expect(generateWithLabels(new VolumeRectangularPrismGenerator(),[...labels,Ability.Formalization,Ability.TextualReception])).toEqual(first);
        }
    });

    it('keeps formula-only selected evidence separate from target Equation participation',()=>{
        for(const view of [formulaExecution,formulaStory]) {
            const base=[...commonLabels,Scope.FractionNumbers,Area.Equation,Ability.ProcedureExecution,
                ...(view===formulaStory?[Ability.TextualReception]:[])];
            expect(plan([...base,Scope.ThreeOperands],view).supported).toBe(true);
            expect(plan([...base,Area.MeasuringVolumes,Scope.CubeScale],view).supported).toBe(false);
            expect(plan([...base,Scope.CubeScale,Scope.ThreeOperands],view).supported).toBe(false);
        }
        expect(plan([...commonLabels,Scope.FractionNumbers,Area.MeasuringVolumes,Scope.CubeScale,Ability.ProcedureExecution],formulaExecution).supported).toBe(false);
    });
});
