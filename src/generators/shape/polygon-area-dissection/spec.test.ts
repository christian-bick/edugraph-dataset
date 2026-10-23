import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {spec as composition, PolygonAreaCompositionViewSchema} from '../../../visuals/views/shape/polygon-area-composition/spec.ts';
import {spec as compositionStory, PolygonAreaCompositionStoryViewSchema} from '../../../visuals/views/shape/polygon-area-composition-story/spec.ts';
import {spec as decomposition, PolygonAreaDecompositionViewSchema} from '../../../visuals/views/shape/polygon-area-decomposition/spec.ts';
import {spec as decompositionStory, PolygonAreaDecompositionStoryViewSchema} from '../../../visuals/views/shape/polygon-area-decomposition-story/spec.ts';
import {isPolygonAreaDissectionProblem} from '../polygon-area-helpers.ts';
import {PolygonAreaDissectionGenerator} from './generator.ts';
import {PolygonAreaDissectionGeneratorSchema, spec} from './spec.ts';

const leaves=[
    [composition,PolygonAreaCompositionViewSchema,false,true],
    [compositionStory,PolygonAreaCompositionStoryViewSchema,true,true],
    [decomposition,PolygonAreaDecompositionViewSchema,false,false],
    [decompositionStory,PolygonAreaDecompositionStoryViewSchema,true,false]
] as const;
const families=[
    [Area.RightTriangle,Area.ShapeSynthesis,'right-triangle'],[Area.AcuteTriangle,Area.ShapeDecomposition,'acute-triangle'],
    [Area.ObtuseTriangle,Area.ShapeDecomposition,'obtuse-triangle'],[Area.Parallelogram,Area.ShapeSynthesis,'parallelogram'],
    [Area.Rhombus,Area.ShapeDecomposition,'rhombus'],[Area.Trapezoid,Area.ShapeDecomposition,'trapezoid'],
    [Area.Kite,Area.ShapeDecomposition,'kite'],[Area.Polygon,Area.ShapeDecomposition,'polygon']
] as const;
function plan(labels: readonly string[],view:typeof composition,id='polygon-area') {
    return planCompatibility({identity:{targetId:id,generatorId:spec.generatorId,viewId:view.viewId},targetLabels:labels,
        generatorLabels:spec.generalLabels,viewLabels:view.generalLabels,generatorRules:spec.compatibility,viewRules:view.compatibility,
        fields:[...normalizeSchemaChoices(PolygonAreaDissectionGeneratorSchema,labels,'generator'),...normalizeSchemaChoices({},labels,'view')]});
}
describe('polygon-area ownership, complete alternatives and actual reviewed plans',()=>{
    it('declares eight exact correlated source-shape/method alternatives with complete fallbacks',()=>{
        expect(spec.generalLabels).toEqual([Area.AreaCalculation]);expect(Object.keys(PolygonAreaDissectionGeneratorSchema)).toEqual(['family']);
        expect(findSchemaFallbackContractIssues(PolygonAreaDissectionGeneratorSchema)).toEqual([]);
        expect(PolygonAreaDissectionGeneratorSchema.family[2]).toEqual(families.map(([shape,method])=>[shape,method]));
        expect(PolygonAreaDissectionGeneratorSchema.family[2].map(labels=>PolygonAreaDissectionGeneratorSchema.family[1]([...labels])))
            .toEqual(families.map(([, ,family])=>family));
        expect(leaves.map(([,schema])=>schema)).toEqual([{}, {}, {}, {}]);
    });

    it('executes all sixteen actual target plans with exactly their authored labels and mathematical family',()=>{
        const targets=[...activeTargets,...implementationTodos].filter(target=>target.id.startsWith('6.G.A.1-polygon-area-dissection~'));
        expect(targets).toHaveLength(16);
        for(const target of targets) {
            const story=target.labels.includes(Ability.TextualReception),synthesis=target.labels.includes(Area.ShapeSynthesis);
            const family=families.find(([shape,method])=>target.labels.includes(shape)&&target.labels.includes(method))!;
            for(const [view,schema,isStory,isSynthesis] of leaves) {
                const result=plan(target.labels,view,target.id),intended=story===isStory&&synthesis===isSynthesis;
                expect(result.supported).toBe(intended);if(!intended||!result.supported)continue;
                const sampleKey=`${target.id}#${spec.generatorId}#${view.viewId}#train#question#inst:0`;
                const resolved=resolvePlannedConfigurations({generatorSchema:PolygonAreaDissectionGeneratorSchema,viewSchema:schema,plan:result.plan,sampleKey,seed:417,attempt:1});
                expect(resolved.generatorConfig.family).toBe(family[2]);
                const draw=generatePlannedDraw({generator:new PolygonAreaDissectionGenerator(),viewSchema:schema,plan:result.plan,sampleKey,seed:417,attempt:1});
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));expect(isPolygonAreaDissectionProblem(draw.stub?.data)).toBe(true);
                if(family[2]==='polygon') {
                    const data=draw.stub?.data;if(!isPolygonAreaDissectionProblem(data))throw Error('Missing complete generic polygon.');
                    expect(data.source.boundary.length).toBeGreaterThanOrEqual(5);
                    expect(draw.labels).not.toContain(Area.AcuteTriangle);expect(draw.labels).not.toContain(Area.Rhombus);
                }
            }
        }
    });

    it('uses mathematical shape/method labels independently of learner Ability',()=>{
        for(const [shape,method] of families) {
            const first=resolveSchemaChoices(PolygonAreaDissectionGeneratorSchema,[shape,method,Ability.SpatialGeneration],{family:[shape,method]});
            const second=resolveSchemaChoices(PolygonAreaDissectionGeneratorSchema,[shape,method,Ability.VisualDecomposition,Ability.TextualReception],{family:[shape,method]});
            expect(second).toEqual(first);
            setSeed(991);const model=new PolygonAreaDissectionGenerator().generate(first.config);
            setSeed(991);expect(new PolygonAreaDissectionGenerator().generate(second.config)).toEqual(model);
            // The diagnostic utility also covers the seven specific families. Its legacy
            // fallback merger tries descendant+Polygon combinations for a generic request;
            // the production admission above selects the exact generic alternative instead.
            if(shape!==Area.Polygon) {
                setSeed(991);const diagnostic=generateWithLabels(new PolygonAreaDissectionGenerator(),[shape,method,Ability.SpatialGeneration]);
                setSeed(991);expect(generateWithLabels(new PolygonAreaDissectionGenerator(),[shape,method,Ability.VisualDecomposition,Ability.TextualReception])).toEqual(diagnostic);
            }
        }
    });
});
