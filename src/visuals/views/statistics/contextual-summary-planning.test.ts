/** Actual27 task participation and preservation of earlier numerical-data consumers. */
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
import {spec as description, DistributionDescriptionViewSchema as descriptionSchema} from './distribution-description/spec.ts';
import {spec as patterns, DistributionPatternsContextViewSchema as patternsSchema} from './distribution-patterns-context/spec.ts';
import {spec as meaningCenter, CenterSummaryInterpretationViewSchema as meaningCenterSchema} from './center-summary-interpretation/spec.ts';
import {spec as meaningVariation, VariationSummaryInterpretationViewSchema as meaningVariationSchema} from './variation-summary-interpretation/spec.ts';
import {spec as plot, NumericalDistributionPlotViewSchema as plotSchema} from './numerical-distribution-plot/spec.ts';
import {spec as count, DataObservationCountViewSchema as countSchema} from './data-observation-count/spec.ts';
import {spec as attribute, DataAttributeDescriptionViewSchema as attributeSchema} from './data-attribute-description/spec.ts';
import {spec as center, ContextualCenterSummaryViewSchema as centerSchema} from './contextual-center-summary/spec.ts';
import {spec as variation, ContextualVariationSummaryViewSchema as variationSchema} from './contextual-variation-summary/spec.ts';

const new27 = [
    {id: '6.SP.B.5c-compute-contextual-center~7dd00831', view: 'contextual-center-summary', area: Area.ArithmeticMean, relations: sets.mean},
    {id: '6.SP.B.5c-compute-contextual-center~743e8ee6', view: 'contextual-center-summary', area: Area.Median, relations: sets.median},
    {id: '6.SP.B.5c-compute-contextual-variation~6db1fc0b', view: 'contextual-variation-summary', area: Area.MeanAbsoluteDeviation, relations: sets.mad},
    {id: '6.SP.B.5c-compute-contextual-variation~a20c08e0', view: 'contextual-variation-summary', area: Area.InterquartileRange, relations: sets.iqr}
] as const;
const old23 = [
    {id: '6.SP.A.2-describe-distribution~07d69eaf', view: 'distribution-description', hash: '09151ecea7246c67848c0f760122862cb25c60b7016789e87134c6a3c8ea3ca1'},
    {id: '6.SP.A.2-describe-distribution~660ce8cf', view: 'distribution-description', hash: 'a2335dc61e5f051ab85d10ab3c1234ec8d360ce57fd0080d2f99016bb5063b52'},
    {id: '6.SP.B.5c-describe-contextual-patterns~3b82371b', view: 'distribution-patterns-context', hash: 'aac59e5062e2b6c0125f9a0084bcc24c03ad3aac973dd8e360f60121706c8674'}
] as const;
const entries = [[description, descriptionSchema], [patterns, patternsSchema], [meaningCenter, meaningCenterSchema],
    [meaningVariation, meaningVariationSchema], [plot, plotSchema], [count, countSchema], [attribute, attributeSchema],
    [center, centerSchema], [variation, variationSchema]] as const;
const expectedViews: Readonly<Record<string, string>> = {
    '6.SP.A.2-describe-distribution': 'distribution-description',
    '6.SP.A.3-interpret-center-summary': 'center-summary-interpretation',
    '6.SP.A.3-interpret-variation-summary': 'variation-summary-interpretation',
    '6.SP.B.4-construct-numerical-distribution-plot': 'numerical-distribution-plot',
    '6.SP.B.5a-observation-count': 'data-observation-count',
    '6.SP.B.5b-data-attribute-description': 'data-attribute-description',
    '6.SP.B.5c-compute-contextual-center': 'contextual-center-summary',
    '6.SP.B.5c-compute-contextual-variation': 'contextual-variation-summary',
    '6.SP.B.5c-describe-contextual-patterns': 'distribution-patterns-context'
};
const prefixes = [...Object.keys(expectedViews), '6.SP.B.5d-select-contextual-summaries'];
const targets = [...active, ...implementationTodos].filter(target => prefixes.includes(target.id.split('~')[0]));
type Target = typeof targets[number];
type Entry = typeof entries[number];
const actual = (id: string): Target => {
    const found = targets.filter(target => target.id === id);
    expect(found).toHaveLength(1); if (found.length !== 1) throw new Error(`Missing actual authored target:${id}`);
    return found[0];
};
const entry = (id: string): Entry => {
    const found = entries.find(value => value[0].viewId === id);
    if (!found) throw new Error(`Missing actual reviewed declaration:${id}`);
    return found;
};
const planner = (target: Target, view: Entry) => planCompatibility({
    identity: {targetId: target.id, generatorId: generatorSpec.generatorId, viewId: view[0].viewId},
    targetLabels: target.labels, generatorLabels: generatorSpec.generalLabels, viewLabels: view[0].generalLabels,
    generatorRules: generatorSpec.compatibility, viewRules: view[0].compatibility,
    fields: [...normalizeSchemaChoices(generatorSchema, target.labels, 'generator'), ...normalizeSchemaChoices(view[1], target.labels, 'view')]
});

describe('package27 contextual summary paired planning', () => {
    it('keeps exactly four actual single-method targets and both required Abilities', () => {
        for (const item of new27) {
            const target = actual(item.id);
            expect(new Set(target.labels)).toEqual(new Set([item.area, Ability.ProcedureExecution, Ability.Interpretation]));
            const alternatives = normalizeSchemaChoices(generatorSchema, target.labels, 'generator')[0].alternatives;
            expect(alternatives).toHaveLength(1);
            const resolved = resolveSchemaChoices(generatorSchema, target.labels, {relations: alternatives[0].labels});
            expect(resolved.config.relations).toEqual(item.relations); expect(resolved.resolvedLabels).toEqual([item.area]);
            expect(new Set(entry(item.view)[0].generalLabels)).toEqual(new Set([Ability.ProcedureExecution, Ability.Interpretation]));
        }
        expect(centerSchema).toEqual({}); expect(variationSchema).toEqual({});
    });

    it('realizes Q/S draws with exact emitted sets and reproducible complete supplied work', () => {
        for (const item of new27) {
            const target = actual(item.id), view = entry(item.view), result = planner(target, view);
            expect(result.supported).toBe(true); if (!result.supported) throw new Error(`Actual27 plan failed:${item.id}`);
            for (const mode of ['question', 'solution'] as const) {
                const sampleKey = `${item.id}#numerical-data#${item.view}#train#${mode}#inst:0`, seed = computeSampleSeed(sampleKey, 1);
                const input = {generator: new NumericalDataGenerator(), viewSchema: view[1], plan: result.plan, sampleKey, seed, attempt: 1};
                const draw = generatePlannedDraw(input), data = draw.stub?.data;
                expect(new Set(draw.labels)).toEqual(new Set(target.labels)); expect(draw.stub?.labels).toEqual([item.area]);
                expect(draw.view.config).toEqual({}); expect(draw.view.labels).toEqual([]); expect(isNumericalDataProblem(data)).toBe(true);
                if (!isNumericalDataProblem(data)) throw new Error('Expected unchanged full mathematical data.');
                expect(data.relations.map(proof => proof.kind)).toEqual(item.relations);
                expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
            }
        }
    });

    it('preserves the known23 plan hashes and keeps meaning-only24 targets out of the stronger27 tasks', () => {
        for (const item of old23) {
            const result = planner(actual(item.id), entry(item.view));
            expect(result.supported).toBe(true); if (!result.supported) throw new Error(`Protected23 path lost:${item.id}`);
            expect(result.plan.hash).toBe(item.hash);
        }
        const meanings = targets.filter(target => target.id.startsWith('6.SP.A.3-interpret-'));
        expect(meanings).toHaveLength(4);
        for (const target of meanings) for (const view of [entry(center.viewId), entry(variation.viewId)]) expect(planner(target, view).supported).toBe(false);
    });

    it('admits exactly16 intended paths across all17 targets and all9 existing-through27 declarations', () => {
        expect(targets).toHaveLength(17); expect(entries).toHaveLength(9);
        let matches = 0, newMatches = 0;
        for (const target of targets) for (const view of entries) {
            const expected = expectedViews[target.id.split('~')[0]] === view[0].viewId, result = planner(target, view);
            expect(result.supported, `${target.id}#${view[0].viewId}`).toBe(expected);
            if (result.supported) { matches++; if (new27.some(item => item.id === target.id && item.view === view[0].viewId)) newMatches++; }
        }
        expect(matches).toBe(16); expect(newMatches).toBe(4);
    });
});
