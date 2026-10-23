/** Real summary-interpretation target plans, preserving the existing distribution routes. */
import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {computeSampleSeed} from '../../../lib/generation.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {implementationTodos, spec as active} from '../../../spec/ccss/grade-06.ts';
import {isNumericalDataProblem} from '../../../generators/statistics/numerical-data-helpers.ts';
import {numericalRelationSets as sets} from '../../../generators/statistics/numerical-data-inputs.ts';
import {NumericalDataGenerator} from '../../../generators/statistics/numerical-data/generator.ts';
import {NumericalDataGeneratorSchema as generatorSchema, spec as generatorSpec} from '../../../generators/statistics/numerical-data/spec.ts';
import {spec as center, CenterSummaryInterpretationViewSchema as centerSchema} from './center-summary-interpretation/spec.ts';
import {spec as variation, VariationSummaryInterpretationViewSchema as variationSchema} from './variation-summary-interpretation/spec.ts';
import {spec as description, DistributionDescriptionViewSchema as descriptionSchema} from './distribution-description/spec.ts';
import {spec as patterns, DistributionPatternsContextViewSchema as patternsSchema} from './distribution-patterns-context/spec.ts';

const proposed24 = [
    {id: '6.SP.A.3-interpret-center-summary~6af4aab6', view: 'center-summary-interpretation', area: Area.ArithmeticMean, relations: sets.mean},
    {id: '6.SP.A.3-interpret-center-summary~771ff795', view: 'center-summary-interpretation', area: Area.Median, relations: sets.median},
    {id: '6.SP.A.3-interpret-variation-summary~6d90c038', view: 'variation-summary-interpretation', area: Area.MeanAbsoluteDeviation, relations: sets.mad},
    {id: '6.SP.A.3-interpret-variation-summary~e3c5f99f', view: 'variation-summary-interpretation', area: Area.InterquartileRange, relations: sets.iqr}
] as const;
const protected23 = [
    {id: '6.SP.A.2-describe-distribution~07d69eaf', view: 'distribution-description', relations: sets.distributionMedian,
        planHash: '09151ecea7246c67848c0f760122862cb25c60b7016789e87134c6a3c8ea3ca1'},
    {id: '6.SP.A.2-describe-distribution~660ce8cf', view: 'distribution-description', relations: sets.distributionMean,
        planHash: 'a2335dc61e5f051ab85d10ab3c1234ec8d360ce57fd0080d2f99016bb5063b52'},
    {id: '6.SP.B.5c-describe-contextual-patterns~3b82371b', view: 'distribution-patterns-context', relations: sets.departure,
        planHash: 'aac59e5062e2b6c0125f9a0084bcc24c03ad3aac973dd8e360f60121706c8674'}
] as const;
const entries = [[center, centerSchema], [variation, variationSchema], [description, descriptionSchema], [patterns, patternsSchema]] as const;
const prefixes = ['6.SP.A.2-describe-distribution', '6.SP.A.3-interpret-center-summary', '6.SP.A.3-interpret-variation-summary',
    '6.SP.B.4-construct-numerical-distribution-plot', '6.SP.B.5a-observation-count', '6.SP.B.5b-data-attribute-description',
    '6.SP.B.5c-compute-contextual-center', '6.SP.B.5c-compute-contextual-variation', '6.SP.B.5c-describe-contextual-patterns',
    '6.SP.B.5d-select-contextual-summaries'];
// These are ACTUAL unchanged authored targets, whether active or still TODO.
const targets = [...active, ...implementationTodos].filter(target => prefixes.includes(target.id.split('~')[0]));
type Target = typeof targets[number];
type Entry = typeof entries[number];
const planner = (target: Target, entry: Entry) => planCompatibility({
    identity: {targetId: target.id, generatorId: generatorSpec.generatorId, viewId: entry[0].viewId},
    targetLabels: target.labels, generatorLabels: generatorSpec.generalLabels, viewLabels: entry[0].generalLabels,
    generatorRules: generatorSpec.compatibility, viewRules: entry[0].compatibility,
    fields: [...normalizeSchemaChoices(generatorSchema, target.labels, 'generator'), ...normalizeSchemaChoices(entry[1], target.labels, 'view')]
});
const actual = (id: string): Target => {
    const found = targets.filter(target => target.id === id);
    expect(found).toHaveLength(1);
    if (found.length !== 1) throw new Error(`Expected one unchanged authored target:${id}`);
    return found[0];
};
const viewEntry = (id: string): Entry => {
    const found = entries.find(entry => entry[0].viewId === id);
    if (!found) throw new Error(`Expected one actual implemented view declaration:${id}`);
    return found;
};

describe('package24 actual statistical-summary consumer planning', () => {
    it('keeps four exact single-measure Interpretation contracts and empty visual schemas', () => {
        expect(generatorSpec.generalLabels).toEqual([]);
        expect(center.generalLabels).toEqual([Ability.Interpretation]);
        expect(variation.generalLabels).toEqual([Ability.Interpretation]);
        expect(centerSchema).toEqual({}); expect(variationSchema).toEqual({});
        for (const item of proposed24) {
            const target = actual(item.id);
            expect(new Set(target.labels)).toEqual(new Set([item.area, Ability.Interpretation]));
            const fields = normalizeSchemaChoices(generatorSchema, target.labels, 'generator');
            expect(fields).toHaveLength(1); expect(fields[0].field).toBe('relations'); expect(fields[0].alternatives).toHaveLength(1);
            const binding = fields[0].alternatives[0];
            const resolved = resolveSchemaChoices(generatorSchema, target.labels, {relations: binding.labels});
            expect(resolved.config.relations).toEqual(item.relations);
            expect(resolved.resolvedLabels).toEqual([item.area]);
        }
    });

    it('plans and realizes every new actual pair with exact complete emitted labels and replay', () => {
        for (const item of proposed24) {
            const target = actual(item.id), entry = viewEntry(item.view), result = planner(target, entry);
            expect(result.supported, `${item.id}#${item.view}`).toBe(true);
            if (!result.supported) throw new Error(`The actual24 pair failed planning:${item.id}`);
            for (const mode of ['question', 'solution'] as const) {
                const sampleKey = `${item.id}#numerical-data#${item.view}#train#${mode}#inst:0`, seed = computeSampleSeed(sampleKey, 1);
                const input = {generator: new NumericalDataGenerator(), viewSchema: entry[1], plan: result.plan, sampleKey, seed, attempt: 1};
                const draw = generatePlannedDraw(input), data = draw.stub?.data;
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                expect(draw.stub?.labels).toEqual([item.area]);
                expect(draw.view.config).toEqual({}); expect(draw.view.labels).toEqual([]);
                expect(isNumericalDataProblem(data)).toBe(true);
                if (!isNumericalDataProblem(data)) throw new Error('Expected the actual complete uniform mathematical payload.');
                expect(data.relations.map(row => row.kind)).toEqual(item.relations);
                expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
            }
        }
    });

    it('preserves all three existing23 routes and their admissible plan hashes and emitted conjunctions', () => {
        for (const item of protected23) {
            const target = actual(item.id), entry = viewEntry(item.view), result = planner(target, entry);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(`Protected23 route lost:${item.id}`);
            expect(result.plan.hash).toBe(item.planHash);
            const sampleKey = `${item.id}#numerical-data#${item.view}#train#question#inst:0`;
            const draw = generatePlannedDraw({generator: new NumericalDataGenerator(), viewSchema: entry[1], plan: result.plan,
                sampleKey, seed: computeSampleSeed(sampleKey, 1), attempt: 1});
            const data = draw.stub?.data;
            expect(new Set(draw.labels)).toEqual(new Set(target.labels));
            expect(isNumericalDataProblem(data)).toBe(true);
            if (!isNumericalDataProblem(data)) throw new Error('Protected23 mathematical payload rejected.');
            expect(new Set(data.relations.map(row => row.kind))).toEqual(new Set(item.relations));
        }
    });

    it('admits exactly seven real paths among all17 authored statistics targets at the24 gate', () => {
        expect(targets).toHaveLength(17);
        const intended = [...proposed24, ...protected23];
        let supported = 0;
        for (const target of targets) for (const entry of entries) {
            const expected = intended.some(item => item.id === target.id && item.view === entry[0].viewId);
            const result = planner(target, entry);
            expect(result.supported, `${target.id}#${entry[0].viewId}`).toBe(expected);
            if (result.supported) supported++;
        }
        expect(supported).toBe(7);
    });
});
