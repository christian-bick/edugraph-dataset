import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import type {CompatibilityQueries} from '../../../types/compatibility.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {NumericalDataProblem} from '../../../types/problems.ts';
import {buildNumericalDataProblem as build, isNumericalDataProblem as valid} from '../../../generators/statistics/numerical-data-helpers.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {contextScalar as q, literalAttributeInput, literalDurationInput, literalFullContextInput, literalLongIntegerCountInput, literalLongRationalCountInput, literalObservationInput, literalRepeatedCelsiusInput, literalZeroCountInput} from './data-context-fixtures.ts';
import {attributeDescriptionEvidence, observationCountEvidence} from './data-context-view-policy.ts';
import {spec as countSpec, DataObservationCountViewSchema} from './data-observation-count/spec.ts';
import {spec as attributeSpec, DataAttributeDescriptionViewSchema} from './data-attribute-description/spec.ts';

const ids = ['data-observation-count', 'data-attribute-description'] as const;
type Id = typeof ids[number];
type Core = (props: {config: {}; payload: ViewRenderPayload<Id>}) => React.ReactNode;
const cores = new Map<Id, Core>();
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [count, attribute] = await Promise.all([import('./data-observation-count/view.tsx'), import('./data-attribute-description/view.tsx')]);
    cores.set(ids[0], count.DataObservationCountCore); cores.set(ids[1], attribute.DataAttributeDescriptionCore);
});
afterAll(() => vi.unstubAllGlobals());
const render = (id: Id, data: NumericalDataProblem, solution: boolean, labels: string[] = []): string => {
    const Component = cores.get(id)!;
    return renderToStaticMarkup(<Component config={{}} payload={{viewId: id, problem: {type: 'statistics', data, labels}, targetLabels: labels, isSolutionView: solution, seed: 17}} />);
};
const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const queries = (generator: readonly string[], target: readonly string[] = []): CompatibilityQueries => ({
    has: (scope, label) => (scope === 'generator' ? generator : scope === 'target' ? target : []).includes(label),
    exact: (scope, label) => (scope === 'generator' ? generator : scope === 'target' ? target : []).includes(label)
});
const countBundle = [Area.StatisticalSample, Area.NumerationWithIntegers, Scope.QuantityMeasurement];
const attributeBundle = [Area.StatisticalVariable];

describe('fixed observation-count and attribute-description consumers', () => {
    it('declares only the authored Abilities and complete selected-evidence bundles', () => {
        expect(countSpec.generalLabels).toEqual([Ability.ProcedureExecution]);
        expect(attributeSpec.generalLabels).toEqual([Ability.InformationExtraction, Ability.TextualArticulation]);
        expect(DataObservationCountViewSchema).toEqual({}); expect(DataAttributeDescriptionViewSchema).toEqual({});
        expect(observationCountEvidence.predicate(queries(countBundle))).toBe(true);
        expect(attributeDescriptionEvidence.predicate(queries(attributeBundle))).toBe(true);
        for (const labels of [[Area.StatisticalSample], [Area.NumerationWithIntegers, Scope.QuantityMeasurement], attributeBundle, [...countBundle, Area.ArithmeticMean]]) expect(observationCountEvidence.predicate(queries(labels))).toBe(false);
        for (const labels of [[], countBundle, [...attributeBundle, Area.EmpiricalDistributionShape], [...attributeBundle, Scope.QuantityMeasurement]]) expect(attributeDescriptionEvidence.predicate(queries(labels))).toBe(false);
        expect(countSpec.compatibility!.every(rule => rule.predicate(queries(countBundle, [...countBundle, Ability.ProcedureExecution])))).toBe(true);
        expect(attributeSpec.compatibility!.every(rule => rule.predicate(queries(attributeBundle, [...attributeBundle, Ability.InformationExtraction, Ability.TextualArticulation])))).toBe(true);
        expect(countSpec.compatibility![0].predicate(queries(countBundle, countBundle))).toBe(false);
        expect(attributeSpec.compatibility![0].predicate(queries(attributeBundle, [...attributeBundle, Ability.InformationExtraction]))).toBe(false);
        expect(attributeSpec.compatibility![0].predicate(queries(attributeBundle, [...attributeBundle, Ability.TextualArticulation]))).toBe(false);
        expect(countSpec.compatibility![0].predicate(queries(countBundle, [Area.NumerationWithIntegers]))).toBe(false);
        expect(attributeSpec.compatibility![0].predicate(queries(attributeBundle, countBundle))).toBe(false);
    });

    it('shows all eight observations in Q without precomputing their count or tally', () => {
        const data = build(literalObservationInput), question = render(ids[0], data, false), visible = text(question);
        expect(data.summary.count).toBe(8); expect(data.frequencies).toHaveLength(4); expect(data.summary.sum).toEqual(q(36));
        expect((question.match(/data-role="observation-value-card"/g) ?? [])).toHaveLength(8);
        expect(visible).toContain('2 2 3 3 3 4 4 15');
        expect(visible).not.toMatch(/\b8\b|\b36\b|Count [1-8]:|R[1-8]|U[1-8]|There are/);
        expect(question).not.toMatch(/observation-count-answer|observation-count-enumeration|emerald|r-7|sample-cardinality/);
        expect(question).toContain('observation-count-blank');
    });

    it('reveals the supplied record bijection and integer observation count in green S', () => {
        const solution = render(ids[0], build(literalObservationInput), true), visible = text(solution);
        expect(visible).toContain('There are 8 recorded observations');
        expect(visible).toContain('Count 1: value 2'); expect(visible).toContain('Count 8: value 15');
        expect(visible).not.toContain('There are 4 recorded observations'); expect(visible).not.toContain('There are 36 recorded observations');
        expect(solution).toContain('text-emerald-800'); expect(solution).not.toContain('observation-count-blank');
    });

    it('reserves readable card widths for long exact integers and fractions without exposing N or totals in Q', () => {
        const cases = [
            {input: literalLongIntegerCountInput, value: '2251799813685247', sum: q(9007199254740988), total: '9007199254740988', characters: 16},
            {input: literalLongRationalCountInput, value: '2251799813685247/2251799813685246', sum: q(4503599627370494, 1125899906842623), total: '4503599627370494/1125899906842623', characters: 33}
        ];
        for (const row of cases) {
            const data = build(row.input), question = render(ids[0], data, false), visible = text(question);
            expect(valid(data)).toBe(true); expect(data.summary.count).toBe(4); expect(data.summary.sum).toEqual(row.sum);
            expect((question.match(/data-role="observation-value-card"/g) ?? [])).toHaveLength(4);
            expect(visible.split(row.value)).toHaveLength(5);
            expect(question).toContain('repeat(auto-fit, minmax(min(100%, max(');
            expect(question).toContain(`calc(${row.characters}ch + 2.25rem)`);
            expect(question).toContain('overflow-wrap:anywhere'); expect(question).not.toContain('grid-cols-4');
            expect(visible).not.toContain(row.total); expect(visible).not.toMatch(/\b4\b|Count [1-4]:|There are/);
            expect(question).not.toMatch(/observation-count-answer|observation-count-enumeration|emerald|r-0|sample-cardinality/);
            expect(text(render(ids[0], data, true))).toContain('There are 4 recorded observations');
        }
    });

    it('counts repeated zero values and repeated occasions, rather than units or distinct supports', () => {
        const zero = build(literalZeroCountInput);
        expect(zero.summary.count).toBe(4); expect(zero.summary.sum).toEqual(q(0));
        const question = render(ids[0], zero, false);
        expect((question.match(/data-role="observation-value-card"/g) ?? [])).toHaveLength(4);
        expect(text(question)).not.toContain('4');
        expect(text(render(ids[0], zero, true))).toContain('There are 4 recorded observations');
        const repeated = build({...literalRepeatedCelsiusInput, relations: ['sample-cardinality']});
        expect(repeated.study.units).toHaveLength(1); expect(repeated.records).toHaveLength(5);
        expect(text(render(ids[0], repeated, true))).toContain('There are 5 recorded observations');
    });

    it('accepts any actual sample enumeration order/bijection without reading labels', () => {
        const data = structuredClone(build(literalObservationInput));
        const sample = data.relations.find(row => row.kind === 'sample-cardinality')!;
        const enumeration = sample.enumeration.map((row, index) => ({...row, ordinal: sample.count - index})).reverse();
        const changed: NumericalDataProblem = {...data, relations: [{...sample, enumeration}]};
        expect(valid(changed)).toBe(true);
        const output = render(ids[0], changed, true);
        expect(text(output)).toContain('There are 8 recorded observations');
        expect(render(ids[0], changed, true, [Area.ArithmeticMean])).toBe(output);
    });

    it('gives real method/unit/occasion facts in attribute Q while leaving the extraction response blank', () => {
        const question = render(ids[1], build(literalAttributeInput), false), visible = text(question);
        expect(visible).toContain('ribbon length in centimeters by using a ruler');
        expect(visible).toContain('U1 (Amber)'); expect(visible).toContain('O1 (Collection session)');
        expect(question).toContain('attribute-description-blank');
        expect(question).not.toMatch(/attribute-description-answer|attribute-recording-links|emerald|variable-recording|r-0/);
    });

    it('articulates the supplied observational unit, attribute, method and units with real incidence links', () => {
        const solution = render(ids[1], build(literalAttributeInput), true), visible = text(solution);
        expect(visible).toContain('Observational unit ribbon Recorded attribute ribbon length Recording method using a ruler Unit of measurement centimeters');
        expect(visible).toContain('U1 (Amber), O1 (Collection session): 2 centimeters');
        expect(solution).toContain('text-emerald-800'); expect(solution).not.toContain('attribute-description-blank');
        expect(visible).not.toMatch(/ratio scale|interval scale|nominal|ordinal scale|UnitDimensionality|MeasurementScale/);
    });

    it('retains repeated occasions, signed Celsius and actual recording precision', () => {
        const data = build(literalRepeatedCelsiusInput), question = text(render(ids[1], data, false)), solution = text(render(ids[1], data, true));
        expect(question).toContain('same unit on different occasions'); expect(question).toContain('using a thermometer');
        expect(question).toContain('precision 1/2 degrees Celsius'); expect(question).toContain('O1 (Dawn)'); expect(question).toContain('O5 (Evening)');
        expect(solution).toContain('thermometer location'); expect(solution).toContain('-3/2 degrees Celsius');
        expect(solution).toContain('U1 (Hill station), O5 (Evening): 5/2 degrees Celsius');
    });

    it('uses the actual timer/counting methods and does not manufacture dimensionality', () => {
        const duration = text(render(ids[1], build(literalDurationInput), true));
        expect(duration).toContain('using a timer'); expect(duration).toContain('journey duration'); expect(duration).toContain('minutes');
        const counted = text(render(ids[1], build({...literalZeroCountInput, relations: ['variable-recording']}), true));
        expect(counted).toContain('counting pencils'); expect(counted).toContain('pencil count'); expect(counted).toContain('items');
        expect(counted).not.toMatch(/using a ruler|precision/);
    });

    it('keeps duplicate display names identifiable through actual registry joins', () => {
        const input = literalAttributeInput;
        const units = input.study.units.map(row => ({...row, name: 'Sam'}));
        const data = build({...input, study: {...input.study, units: [units[0], ...units.slice(1)]}});
        const output = text(render(ids[1], data, true));
        expect(output).toContain('U1 (Sam)'); expect(output).toContain('U2 (Sam)');
        expect(output).not.toContain('u-a');
    });

    it('accepts all twelve coherent theorem families through both cores in both modes', () => {
        const full = build(literalFullContextInput);
        for (const proof of full.relations) {
            const data: NumericalDataProblem = {...full, relations: [proof]};
            expect(valid(data)).toBe(true);
            for (const id of ids) for (const solution of [false, true]) expect(render(id, data, solution)).not.toMatch(/NaN|undefined|Infinity/);
        }
        const fallback: NumericalDataProblem = {...full, relations: [full.relations[0]]};
        expect(text(render(ids[0], fallback, true))).toContain('There are 8 recorded observations');
        expect(render(ids[0], fallback, true)).not.toContain('observation-count-enumeration');
        expect(render(ids[1], fallback, true)).toContain('attribute-recording-links');
    });

    it('accepts valid evidence/registry permutations and broad two-tick frames', () => {
        const data = build(literalFullContextInput);
        const changed: NumericalDataProblem = {...data, study: {...data.study, units: [data.study.units[0], ...data.study.units.slice(1).reverse()]},
            relations: [data.relations.at(-1)!, ...data.relations.slice(0, -1).reverse()]};
        expect(valid(changed)).toBe(true);
        for (const id of ids) for (const solution of [false, true]) expect(render(id, changed, solution)).not.toMatch(/NaN|undefined/);
        const wide = build({...literalAttributeInput, axes: {value: {minimum: q(0), maximum: q(16), step: q(16), ticks: [q(0), q(16)], zeroIndex: 0},
            count: {minimum: q(0), maximum: q(8), step: q(8), ticks: [q(0), q(8)], zeroIndex: 0}}});
        for (const id of ids) for (const solution of [false, true]) expect(render(id, wide, solution)).not.toMatch(/NaN|undefined/);
    });

    it('rejects malformed records, incidence links, sample bijections and unsafe values through the view boundary', () => {
        const changes: ((data: any) => void)[] = [data => {delete data.departureFacts;}, data => {data.records = new Array(8);},
            data => {data.summary.count = 7;}, data => {data.study.attribute.method = 'timer';}, data => {data.records[0].unitId = 'missing';},
            data => {data.relations = [{kind: 'sample-cardinality', count: 8, enumeration: []}];},
            data => {data.relations = [{kind: 'variable-recording', attributeId: 'wrong', incidences: []}];},
            data => {data.records[0].value = q(-0);}, data => {data.records[0].value = q(2, 2);}];
        for (const change of changes) {
            const data = structuredClone(build(literalFullContextInput)); change(data); expect(valid(data)).toBe(false);
            for (const id of ids) expect(() => render(id, data, false)).toThrow(ViewValidationError);
        }
    });
});
