/** Real observation-count and recorded-attribute target plans against the frozen producer. */
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {computeSampleSeed} from '../../../lib/generation.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {implementationTodos, spec as active} from '../../../spec/ccss/grade-06.ts';
import {isNumericalDataProblem} from '../../../generators/statistics/numerical-data-helpers.ts';
import {numericalRelationSets as sets} from '../../../generators/statistics/numerical-data-inputs.ts';
import {NumericalDataGenerator} from '../../../generators/statistics/numerical-data/generator.ts';
import {spec as generatorSpec, NumericalDataGeneratorSchema as schema} from '../../../generators/statistics/numerical-data/spec.ts';
import {spec as count, DataObservationCountViewSchema as countSchema} from './data-observation-count/spec.ts';
import {spec as attribute, DataAttributeDescriptionViewSchema as attributeSchema} from './data-attribute-description/spec.ts';

const intended = [
    {id: '6.SP.B.5a-observation-count~3ac7abbf', view: 'data-observation-count', relations: sets.sample,
        generatorLabels: [Area.StatisticalSample, Area.NumerationWithIntegers, Scope.QuantityMeasurement], viewLabels: [Ability.ProcedureExecution]},
    {id: '6.SP.B.5b-data-attribute-description~39c4678b', view: 'data-attribute-description', relations: sets.variable,
        generatorLabels: [Area.StatisticalVariable], viewLabels: [Ability.InformationExtraction, Ability.TextualArticulation]}
] as const;
const prefixes = ['6.SP.A.2-describe-distribution', '6.SP.A.3-interpret-center-summary', '6.SP.A.3-interpret-variation-summary',
    '6.SP.B.4-construct-numerical-distribution-plot', '6.SP.B.5a-observation-count', '6.SP.B.5b-data-attribute-description',
    '6.SP.B.5c-compute-contextual-center', '6.SP.B.5c-compute-contextual-variation', '6.SP.B.5c-describe-contextual-patterns',
    '6.SP.B.5d-select-contextual-summaries'];
const targets = [...active, ...implementationTodos].filter(target => prefixes.includes(target.id.split('~')[0]));
const entries = [[count, countSchema], [attribute, attributeSchema]] as const;
type Target = typeof targets[number];
type Entry = typeof entries[number];
const planner = (target: Target, entry: Entry) => planCompatibility({identity: {targetId: target.id, generatorId: generatorSpec.generatorId, viewId: entry[0].viewId},
    targetLabels: target.labels, generatorLabels: generatorSpec.generalLabels, viewLabels: entry[0].generalLabels,
    generatorRules: generatorSpec.compatibility, viewRules: entry[0].compatibility,
    fields: [...normalizeSchemaChoices(schema, target.labels, 'generator'), ...normalizeSchemaChoices(entry[1], target.labels, 'view')]
});

describe('actual observation/attribute consumer planning', () => {
    it('resolves each exact full target to the original sample or variable theorem bundle', () => {
        for (const item of intended) {
            const candidates = targets.filter(target => target.id === item.id); expect(candidates).toHaveLength(1);
            const target = candidates[0];
            expect(new Set(target.labels)).toEqual(new Set([...item.generatorLabels, ...item.viewLabels]));
            const fields = normalizeSchemaChoices(schema, target.labels, 'generator');
            expect(fields).toHaveLength(1); expect(fields[0].alternatives).toHaveLength(1);
            const selection = fields[0].alternatives[0];
            const resolved = resolveSchemaChoices(schema, target.labels, {relations: selection.labels});
            expect(resolved.config.relations).toEqual(item.relations);
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set<string>(item.generatorLabels));
        }
    });

    it('supports exactly the two authored current routes among all17 actual statistical targets', () => {
        expect(targets).toHaveLength(17);
        let supported = 0;
        for (const target of targets) for (const entry of entries) {
            const wanted = intended.some(item => item.id === target.id && item.view === entry[0].viewId);
            const result = planner(target, entry); expect(result.supported, `${target.id}#${entry[0].viewId}`).toBe(wanted);
            if (result.supported) supported++;
        }
        expect(supported).toBe(2);
    });

    it('materializes actual Q/S plans with complete emitted claims and recorded replay', () => {
        for (const item of intended) {
            const target = targets.find(target => target.id === item.id), entry = entries.find(entry => entry[0].viewId === item.view);
            if (!target || !entry) throw new Error('Expected actual authored target and implemented consumer declaration.');
            const result = planner(target, entry); expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(`The real pair failed:${item.id}`);
            for (const mode of ['question', 'solution'] as const) {
                const sampleKey = `${item.id}#numerical-data#${item.view}#train#${mode}#inst:0`;
                const input = {generator: new NumericalDataGenerator(), viewSchema: entry[1], plan: result.plan, sampleKey, attempt: 1, seed: computeSampleSeed(sampleKey, 1)};
                const draw = generatePlannedDraw(input), data = draw.stub?.data;
                expect(new Set(draw.labels)).toEqual(new Set(target.labels)); expect(new Set(draw.stub?.labels)).toEqual(new Set<string>(item.generatorLabels));
                expect(draw.view.config).toEqual({}); expect(draw.view.labels).toEqual([]); expect(isNumericalDataProblem(data)).toBe(true);
                if (!isNumericalDataProblem(data)) throw new Error('Expected the full uniform numerical-data family.');
                expect(data.relations.map(row => row.kind)).toEqual(item.relations);
                expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
            }
        }
    });
});
