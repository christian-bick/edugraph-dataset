import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {AlgebraDependentEquationModelViewSchema, spec as model} from '../../../visuals/views/operations/algebra-dependent-equation-model/spec.ts';
import {AlgebraCovariationInterpretationViewSchema, spec as interpretation} from '../../../visuals/views/operations/algebra-covariation-interpretation/spec.ts';
import {AlgebraCovariationTableGraphViewSchema, spec as construction} from '../../../visuals/views/operations/algebra-covariation-table-graph/spec.ts';
import {AlgebraCovariationGenerator} from './generator.ts';
import {AlgebraCovariationGeneratorSchema, spec} from './spec.ts';

const leaves=[
    ['6.EE.C.9-model-dependent-quantity~',model,AlgebraDependentEquationModelViewSchema,2],
    ['6.EE.C.9-relate-equation-table-graph~',interpretation,AlgebraCovariationInterpretationViewSchema,1],
    ['6.EE.C.9-tabulate-and-graph-covariation~',construction,AlgebraCovariationTableGraphViewSchema,0]
] as const;
function plan(labels: readonly string[],view:typeof model,id='covariation') {
    return planCompatibility({identity:{targetId:id,generatorId:spec.generatorId,viewId:view.viewId},targetLabels:labels,
        generatorLabels:spec.generalLabels,viewLabels:view.generalLabels,generatorRules:spec.compatibility,viewRules:view.compatibility,
        fields:[...normalizeSchemaChoices(AlgebraCovariationGeneratorSchema,labels,'generator'),...normalizeSchemaChoices({},labels,'view')]});
}
describe('covariation claim ownership and actual target plans', () => {
    it('declares only the common function/equation and three complete material relation alternatives', () => {
        expect(spec.generalLabels).toEqual([Area.NumericFunction,Area.Equation]);expect(Object.keys(AlgebraCovariationGeneratorSchema)).toEqual(['relations']);
        expect(findSchemaFallbackContractIssues(AlgebraCovariationGeneratorSchema)).toEqual([]);
        expect(AlgebraCovariationGeneratorSchema.relations[2]).toEqual([[Area.AlgebraicModeling,Area.IndependentVariable,Area.DependentVariable],[Area.IndependentVariable,Area.DependentVariable],[]]);
        expect(AlgebraCovariationGeneratorSchema.relations[2].map(labels=>AlgebraCovariationGeneratorSchema.relations[1]([...labels])))
            .toEqual(['quantitative-origin','designated-dependency','numerical-correspondence']);
        expect(leaves.map(([, ,schema])=>schema)).toEqual([{}, {}, {}]);
    });

    it('executes all three actual reviewed target plans with precisely the authored emitted sets', () => {
        const targets=[...activeTargets,...implementationTodos];
        for (const [prefix,view,schema,proofCount] of leaves) {
            const selected=targets.filter(target=>target.id.startsWith(prefix));expect(selected).toHaveLength(1);
            for (const target of selected) {
                const result=plan(target.labels,view,target.id);expect(result.supported).toBe(true);if(!result.supported)continue;
                for (let seed=0;seed<8;seed++) {
                    const draw=generatePlannedDraw({generator:new AlgebraCovariationGenerator(),viewSchema:schema,plan:result.plan,
                        sampleKey:`${target.id}#${spec.generatorId}#${view.viewId}#train#question#inst:0`,seed,attempt:1});
                    expect(new Set(draw.labels)).toEqual(new Set(target.labels));expect(draw.stub?.data.selectedRelations).toHaveLength(proofCount);
                }
                for (const [,other] of leaves) if(other.viewId!==view.viewId) expect(plan(target.labels,other).supported).toBe(false);
            }
        }
    });

    it('uses relation labels for mathematics independently of Ability', () => {
        for (const labels of AlgebraCovariationGeneratorSchema.relations[2]) {
            setSeed(31);const first=generateWithLabels(new AlgebraCovariationGenerator(),[...labels,Ability.Formalization]);
            setSeed(31);expect(generateWithLabels(new AlgebraCovariationGenerator(),[...labels,Ability.Interpretation])).toEqual(first);
        }
    });
});
