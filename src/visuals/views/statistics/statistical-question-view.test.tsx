import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability} from 'edugraph-ts';
import {buildStatisticalQuestionsProblem, isStatisticalQuestionsProblem as valid} from '../../../generators/statistics/statistical-question-helpers.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {StatisticalInvestigation, StatisticalQuestionsProblem as Problem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {literalColorInvestigation, literalEmptyBoxInvestigation, literalRectangleInvestigation, literalRepeatedDieInvestigation, literalSingleDieInvestigation, literalStatisticalQuestionsProblem, literalTriangleInvestigation} from './statistical-question-fixtures.ts';
import {orderStatisticalInvestigations} from './statistical-question-format.tsx';
import {spec, StatisticalQuestionClassificationViewSchema} from './statistical-question-classification/spec.ts';

const id = 'statistical-question-classification';
type Core = (props: {config: {}; payload: ViewRenderPayload<typeof id>}) => React.ReactNode;
let Core: Core;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Core = (await import('./statistical-question-classification/view.tsx')).StatisticalQuestionClassificationCore;
});
afterAll(() => vi.unstubAllGlobals());
const render = (data: Problem, solution: boolean, seed = 7): string => renderToStaticMarkup(<Core config={{}} payload={{viewId: id, problem: {type: 'statistics', data, labels: []}, targetLabels: [], isSolutionView: solution, seed}} />);
const problem = (first: StatisticalInvestigation, ...rest: StatisticalInvestigation[]): Problem => ({kind: 'statistical-questions', investigations: [first, ...rest]});
const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const fixtures = [literalRepeatedDieInvestigation, literalSingleDieInvestigation, literalColorInvestigation, literalTriangleInvestigation, literalRectangleInvestigation, literalEmptyBoxInvestigation] as const;

describe('statistical question classification', () => {
    it('declares only the fixed classification task and an empty schema', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptClassification]);
        expect(StatisticalQuestionClassificationViewSchema).toEqual({});
    });
    it('accepts independent uncertain-single, repeated-trial, menu and fixed-rule certificates', () => {
        for (const value of fixtures) expect(valid(problem(value))).toBe(true);
        expect(valid(literalStatisticalQuestionsProblem)).toBe(true);
        expect(literalRepeatedDieInvestigation.variability.kind).toBe('anticipated-variation');
        expect(literalSingleDieInvestigation.variability.kind).toBe('single-observation');
        expect(literalTriangleInvestigation.variability.kind).toBe('constant-response');
    });
    it('keeps the full unit-by-occasion inquiry but withholds classification and possibilities in Q', () => {
        const question = render(literalStatisticalQuestionsProblem, false);
        expect((question.match(/data-role="statistical-investigation-card"/g) ?? []).length).toBe(3);
        expect((question.match(/data-role="statistical-classification-blank"/g) ?? []).length).toBe(3);
        expect(text(question)).toContain('U1: Die A');
        expect(text(question)).toContain('O1: Trial A; O2: Trial B; O3: Trial C');
        expect(text(question)).toContain('every named unit on every named occasion');
        expect(text(question)).toContain('standard six-sided die is rolled once');
        expect(question).not.toMatch(/statistical-classification-answer|statistical-possibility-proof|emerald|could give|planned observations|anticipated-variation|single-observation|constant-response|literal-repeated-die|roll-a/);
        expect(question).not.toMatch(/aria-label=|title=|data-verdict=|data-classification=/);
    });
    it('explains anticipated variation across repeated occasions for one unit without claiming observed diversity', () => {
        const solution = render(problem(literalRepeatedDieInvestigation), true);
        expect(text(solution)).toContain('Statistical Responses may vary across the 3 planned observations');
        expect(text(solution)).toContain('U1 (Die A) on O1 (Trial A) could give 1');
        expect(text(solution)).toContain('U1 (Die A) on O3 (Trial C) could give 6');
        expect(text(solution)).toContain('possible responses before collection');
        expect(text(solution)).toContain('A future collection can still contain equal responses');
        expect(solution).toContain('text-emerald-800');
        expect(solution).not.toContain('statistical-classification-blank');
    });
    it('distinguishes one uncertain outcome from a fixed-response collection', () => {
        const single = text(render(problem(literalSingleDieInvestigation), true));
        const constant = text(render(problem(literalTriangleInvestigation), true));
        expect(single).toContain('Not statistical This asks for one specified response');
        expect(single).toContain('Uncertainty about that response does not create variation among multiple observations');
        expect(constant).toContain('Not statistical The stated attribute or rule fixes every planned response at 3');
        expect(constant).toContain('All 2 planned observations have the same response');
    });
    it('preserves a categorical menu and disambiguates repeated unit and occasion names', () => {
        const question = render(problem(literalColorInvestigation), false), solution = render(problem(literalColorInvestigation), true);
        expect(text(question)).toContain('U1: Sam; U2: Sam');
        expect(text(question)).toContain('O1: Choice; O2: Choice');
        expect(text(question)).toContain('menu (red, blue)');
        expect(text(question)).toContain('Each occasion allows a fresh choice');
        expect(text(solution)).toContain('U1 (Sam) on O2 (Choice) could give blue');
        expect(text(solution)).toContain('U2 (Sam) on O1 (Choice) could give red');
        expect(solution).not.toContain('response-ab');
    });
    it('shows the exact box rule in Q and the supplied zero constant in S', () => {
        const question = text(render(problem(literalEmptyBoxInvestigation), false));
        const solution = text(render(problem(literalEmptyBoxInvestigation), true));
        expect(question).toContain('exactly 0 pencils per box');
        expect(question).not.toContain('fixes every planned response');
        expect(solution).toContain('fixes every planned response at 0');
        expect(solution).toContain('All 2 planned observations have the same response');
    });
    it('accepts both valid certificates when one fixed observation is specified', () => {
        const single: StatisticalInvestigation = {...literalRectangleInvestigation, variability: {kind: 'single-observation', observationId: 'rectangle-sides'}};
        expect(valid(problem(single))).toBe(true);
        expect(text(render(problem(single), true))).toContain('one specified response');
        expect(text(render(problem(literalRectangleInvestigation), true))).toContain('fixes every planned response at 4');
        expect(text(render(problem(single), false))).toBe(text(render(problem(literalRectangleInvestigation), false)));
    });
    it('uses only the required seed for a repeatable, nonmutating, classification-independent permutation', () => {
        const before = JSON.stringify(literalStatisticalQuestionsProblem);
        const first = orderStatisticalInvestigations(literalStatisticalQuestionsProblem, 124).map(value => value.id);
        expect(orderStatisticalInvestigations(literalStatisticalQuestionsProblem, 124).map(value => value.id)).toEqual(first);
        const orders = new Set(Array.from({length: 20}, (_, seed) => orderStatisticalInvestigations(literalStatisticalQuestionsProblem, seed).map(value => value.id).join('|')));
        expect(orders.size).toBeGreaterThan(2);
        expect(new Set(Array.from({length: 20}, (_, seed) => orderStatisticalInvestigations(literalStatisticalQuestionsProblem, seed)[0].variability.kind)).size).toBe(3);
        expect(JSON.stringify(literalStatisticalQuestionsProblem)).toBe(before);
        expect(render(literalStatisticalQuestionsProblem, false, 124)).toBe(render(literalStatisticalQuestionsProblem, false, 124));
    });
    it('projects broad array lengths and complete alternate registry orders rather than a three-card template', () => {
        for (const data of [problem(literalRepeatedDieInvestigation), problem(literalSingleDieInvestigation, literalRectangleInvestigation), problem(...fixtures)]) {
            expect(valid(data)).toBe(true);
            for (const solution of [false, true]) expect((render(data, solution).match(/data-role="statistical-investigation-card"/g) ?? []).length).toBe(data.investigations.length);
        }
        const data = structuredClone(literalColorInvestigation);
        const reversed = [...data.observationPlan.indices].reverse();
        data.observationPlan.indices = [reversed[0]!, ...reversed.slice(1)];
        data.responseDomain = {kind: 'categorical', values: ['blue', 'red']};
        expect(valid(problem(data))).toBe(true);
        expect(render(problem(data), true)).toBe(render(problem(literalColorInvestigation), true));
    });
    it('keeps internal source identifiers out of every displayed mode', () => {
        const data = structuredClone(problem(literalColorInvestigation));
        const original = data.investigations[0];
        const renamed = JSON.parse(JSON.stringify(data).replaceAll('literal-color', 'internal-investigation-new').replaceAll('person-a', 'internal-person-new-a').replaceAll('person-b', 'internal-person-new-b').replaceAll('choice-a', 'internal-occasion-new-a').replaceAll('choice-b', 'internal-occasion-new-b').replaceAll('response-aa', 'internal-index-new-aa').replaceAll('response-ab', 'internal-index-new-ab').replaceAll('response-ba', 'internal-index-new-ba').replaceAll('response-bb', 'internal-index-new-bb')) as Problem;
        expect(original.id).toBe('literal-color');
        expect(valid(renamed)).toBe(true);
        for (const solution of [false, true]) expect(render(renamed, solution)).toBe(render(data, solution));
    });
    it('adopts the complete builder interface without restricting source attributes or unit multiplicity', () => {
        const data = buildStatisticalQuestionsProblem([{id: 'builder-menu', populationName: 'A repeated choice', units: [{id: 'one', name: 'Person 1', kind: 'person'}], occasions: [{id: 'first', name: 'First choice'}, {id: 'second', name: 'Second choice'}], attribute: {kind: 'color-choice', alternatives: ['green', 'purple', 'orange']}}]);
        expect(valid(data)).toBe(true);
        expect(text(render(data, false))).toContain('menu (green, purple, orange)');
        expect(render(data, true)).toContain('statistical-possibility-proof');
    });
    it('fails malformed complete models through ViewValidationError before rendering', () => {
        const mutations: ((value: any) => void)[] = [
            value => {delete value.kind;},
            value => {value.investigations = [];},
            value => {value.investigations = new Array(1);},
            value => {value.investigations[0].observationPlan.indices = new Array(3);},
            value => {value.investigations[0].observationPlan.observationCount = 2;},
            value => {value.investigations[0].responseDomain.values.pop();},
            value => {value.investigations[0].variability.possibilities[1].observationId = 'roll-a';},
            value => {value.investigations[0].variability.possibilities[1].response.value.numerator = 1;},
            value => {value.investigations[0].observationPlan.units[0].kind = 'person';}
        ];
        for (const mutate of mutations) {
            const data = structuredClone(literalStatisticalQuestionsProblem);
            mutate(data);
            expect(valid(data)).toBe(false);
            expect(() => render(data, false)).toThrow(ViewValidationError);
        }
    });
    it('contains no unsupported placeholder glyph, broken scalar or implementation proof tag', () => {
        for (const value of fixtures) for (const solution of [false, true]) expect(render(problem(value), solution)).not.toMatch(/□|→|undefined|NaN|Infinity|data-evidence=|data-variability=/);
    });
});
