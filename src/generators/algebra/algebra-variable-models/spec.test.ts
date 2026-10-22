import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {AlgebraVariableInterpretationViewSchema, spec as view} from '../../../visuals/views/operations/algebra-variable-interpretation/spec.ts';
import {AlgebraVariableModelsGenerator} from './generator.ts';
import {AlgebraVariableModelsGeneratorSchema, spec} from './spec.ts';

function plan(labels: readonly string[], id='variable-role') {
    return planCompatibility({identity:{targetId:id,generatorId:spec.generatorId,viewId:view.viewId},targetLabels:labels,
        generatorLabels:spec.generalLabels,viewLabels:view.generalLabels,generatorRules:spec.compatibility,viewRules:view.compatibility,
        fields:[...normalizeSchemaChoices(AlgebraVariableModelsGeneratorSchema,labels,'generator'),...normalizeSchemaChoices(AlgebraVariableInterpretationViewSchema,labels,'view')]});
}
describe('exact variable-role ownership and complete fallbacks', () => {
    it('owns exactly the two mathematical roles while the fixed view owns Interpretation', () => {
        expect(spec.generalLabels).toEqual([]); expect(Object.keys(AlgebraVariableModelsGeneratorSchema)).toEqual(['role']);
        expect(view.generalLabels).toEqual([Ability.Interpretation]); expect(AlgebraVariableInterpretationViewSchema).toEqual({});
        expect(findSchemaFallbackContractIssues(AlgebraVariableModelsGeneratorSchema)).toEqual([]);
        expect(AlgebraVariableModelsGeneratorSchema.role[2]).toEqual([[Area.UnknownVariable],[Area.GeneralizedVariable]]);
        expect(AlgebraVariableModelsGeneratorSchema.role[2].map(labels=>AlgebraVariableModelsGeneratorSchema.role[1]([...labels])))
            .toEqual(['particular-unknown','arbitrary-generalized-number']);
    });

    it('executes both actual reviewed target plans with precisely their original role and Ability claims', () => {
        const targets=[...activeTargets,...implementationTodos].filter(target=>target.id.startsWith('6.EE.B.6-interpret-variable-roles~'));
        expect(targets).toHaveLength(2);
        for (const target of targets) {
            const result=plan(target.labels,target.id); expect(result.supported).toBe(true);
            if (!result.supported) continue;
            for (let seed=0; seed<12; seed++) {
                const draw=generatePlannedDraw({generator:new AlgebraVariableModelsGenerator(),viewSchema:AlgebraVariableInterpretationViewSchema,
                    plan:result.plan,sampleKey:`${target.id}#${spec.generatorId}#${view.viewId}#train#question#inst:0`,seed,attempt:1});
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                expect(draw.stub?.data.role.kind).toBe(target.labels.includes(Area.UnknownVariable)?'particular-unknown':'arbitrary-generalized-number');
            }
        }
    });

    it('does not silently supply an incidental role to other interpretation tasks or let Ability change the mathematics', () => {
        expect(plan([Ability.Interpretation]).supported).toBe(false);
        expect(plan([Area.Equation,Ability.Interpretation]).supported).toBe(false);
        expect(plan([Area.UnknownVariable,Area.GeneralizedVariable,Ability.Interpretation]).supported).toBe(false);
        for (const role of [Area.UnknownVariable,Area.GeneralizedVariable]) {
            setSeed(41); const first=generateWithLabels(new AlgebraVariableModelsGenerator(),[role,Ability.Interpretation]);
            setSeed(41); expect(generateWithLabels(new AlgebraVariableModelsGenerator(),[role,Ability.ConceptClassification])).toEqual(first);
        }
    });
});
