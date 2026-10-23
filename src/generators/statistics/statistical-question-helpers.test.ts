import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {StatisticalQuestionsProblem} from '../../types/problems.ts';
import {
    buildStatisticalQuestionsProblem, isStatisticalQuestionsProblem,
    type StatisticalInvestigationInput
} from './statistical-question-helpers.ts';

const clone = <T>(value: T): T => structuredClone(value);
const nonempty = <T>(values: T[]): [T, ...T[]] => [values[0], ...values.slice(1)];
const q = (numerator: number) => ({numerator, denominator: 1});
const die = (): StatisticalQuestionsProblem => ({kind: 'statistical-questions', investigations: [{
    id: 'independent-source',
    observationPlan: {populationName: 'One die across two trials',
        units: [{id: 'd', name: 'Die A', kind: 'die'}],
        occasions: [{id: 'm', name: 'Monday'}, {id: 't', name: 'Tuesday'}],
        indices: [{id: 'first', unitId: 'd', occasionId: 'm'}, {id: 'next', unitId: 'd', occasionId: 't'}], observationCount: 2},
    attribute: {kind: 'upper-face-number', die: 'standard-six-sided'},
    responseDomain: {kind: 'numeric', values: [q(1), q(2), q(3), q(4), q(5), q(6)]},
    variability: {kind: 'anticipated-variation', possibilities: [
        {observationId: 'first', response: {kind: 'numeric', value: q(1)}},
        {observationId: 'next', response: {kind: 'numeric', value: q(6)}}]}
}]});
const box = (): StatisticalQuestionsProblem => ({kind: 'statistical-questions', investigations: [{
    id: 'boxes',
    observationPlan: {populationName: 'Sealed classroom boxes',
        units: [{id: 'left', name: 'Left box', kind: 'sealed-pencil-box'}, {id: 'right', name: 'Right box', kind: 'sealed-pencil-box'}],
        occasions: [{id: 'today', name: 'Today'}],
        indices: [{id: 'a', unitId: 'left', occasionId: 'today'}, {id: 'b', unitId: 'right', occasionId: 'today'}], observationCount: 2},
    attribute: {kind: 'sealed-pencil-count', pencilsPerBox: 12}, responseDomain: {kind: 'numeric', values: [q(12)]},
    variability: {kind: 'constant-response', response: {kind: 'numeric', value: q(12)}}
}]});
const color = (): StatisticalQuestionsProblem => ({kind: 'statistical-questions', investigations: [{
    id: 'one-choice',
    observationPlan: {populationName: 'One pupil on one occasion', units: [{id: 'p', name: 'Sam', kind: 'person'}],
        occasions: [{id: 'now', name: 'Now'}], indices: [{id: 'one', unitId: 'p', occasionId: 'now'}], observationCount: 1},
    attribute: {kind: 'color-choice', alternatives: ['red', 'blue']}, responseDomain: {kind: 'categorical', values: ['red', 'blue']},
    variability: {kind: 'single-observation', observationId: 'one'}
}]});
const dieInput = (): StatisticalInvestigationInput => ({id: 'rolls', populationName: 'A die across repeated trials',
    units: [{id: 'd', name: 'Die A', kind: 'die'}], occasions: [{id: 'a', name: 'Trial A'}, {id: 'b', name: 'Trial B'}],
    attribute: {kind: 'upper-face-number', die: 'standard-six-sided'}});
const inputOf = (problem: StatisticalQuestionsProblem): StatisticalInvestigationInput => {
    const source = problem.investigations[0];
    return {id: source.id, populationName: source.observationPlan.populationName, units: source.observationPlan.units,
        occasions: source.observationPlan.occasions, attribute: source.attribute};
};
const invalidBuild = (value: unknown) => buildStatisticalQuestionsProblem(value as Parameters<typeof buildStatisticalQuestionsProblem>[0]);
const mutate = (source: StatisticalQuestionsProblem, change: (value: any) => void): unknown => {
    const value = clone(source);
    change(value);
    return value;
};
const invalid = (source: StatisticalQuestionsProblem, changes: ((value: any) => void)[]) => {
    for (const change of changes) expect(isStatisticalQuestionsProblem(mutate(source, change))).toBe(false);
};

describe('statistical-question semantic helpers', () => {
    it('accepts complete independent literal possibility, constant-rule and single-observation certificates', () => {
        for (const literal of [die(), box(), color()]) expect(isStatisticalQuestionsProblem(literal)).toBe(true);
        const combined: StatisticalQuestionsProblem = {kind: 'statistical-questions', investigations: [
            die().investigations[0], box().investigations[0], color().investigations[0]]};
        expect(isStatisticalQuestionsProblem(combined)).toBe(true);
        expect(combined.investigations.map(source => source.variability.kind)).toEqual([
            'anticipated-variation', 'constant-response', 'single-observation']);
        expect(combined.investigations.every(source => !('observations' in source))).toBe(true);
    });

    it('derives exact Cartesian indices, complete domains and before-collection possibilities', () => {
        const source = dieInput();
        source.units = [{id: 'u:1', name: 'First', kind: 'die'}, {id: 'u', name: 'Second', kind: 'die'}];
        source.occasions = [{id: '1:v', name: 'Morning'}, {id: 'v', name: 'Evening'}, {id: 'later', name: 'Later'}];
        const result = buildStatisticalQuestionsProblem([source]);
        const investigation = result.investigations[0];
        expect(investigation.observationPlan.observationCount).toBe(6);
        expect(new Set(investigation.observationPlan.indices.map(row => JSON.stringify([row.unitId, row.occasionId])))).toEqual(new Set([
            '["u:1","1:v"]', '["u:1","v"]', '["u:1","later"]', '["u","1:v"]', '["u","v"]', '["u","later"]']));
        expect(investigation.responseDomain).toEqual({kind: 'numeric', values: [q(1), q(2), q(3), q(4), q(5), q(6)]});
        expect(investigation.variability).toEqual({kind: 'anticipated-variation', possibilities: [
            {observationId: 'rolls:observation:1', response: {kind: 'numeric', value: q(1)}},
            {observationId: 'rolls:observation:2', response: {kind: 'numeric', value: q(2)}}]});
        expect(isStatisticalQuestionsProblem(result)).toBe(true);
    });

    it('distinguishes one uncertain observation, repeated one-person choices and plural universal constants', () => {
        const single = inputOf(color());
        const repeated = {...single, id: 'repeated', occasions: [{id: 'm', name: 'Monday'}, {id: 't', name: 'Tuesday'}]} satisfies StatisticalInvestigationInput;
        const result = buildStatisticalQuestionsProblem([single, repeated, inputOf(box())]);
        expect(result.investigations.map(source => source.observationPlan.observationCount)).toEqual([1, 2, 2]);
        expect(result.investigations.map(source => source.variability.kind)).toEqual([
            'single-observation', 'anticipated-variation', 'constant-response']);
        expect(result.investigations[1].responseDomain).toEqual({kind: 'categorical', values: ['red', 'blue']});
    });

    it('grounds every attribute domain, including zero and MAX_SAFE packing counts', () => {
        for (const shape of ['triangle', 'rectangle'] as const) {
            const source: StatisticalInvestigationInput = {id: shape, populationName: 'Shapes',
                units: [{id: 'x', name: 'First shape', kind: shape}, {id: 'y', name: 'Second shape', kind: shape}],
                occasions: [{id: 'today', name: 'Today'}], attribute: {kind: 'side-count', shape}};
            const result = buildStatisticalQuestionsProblem([source]);
            expect(result.investigations[0].responseDomain).toEqual({kind: 'numeric', values: [q(shape === 'triangle' ? 3 : 4)]});
            expect(result.investigations[0].variability.kind).toBe('constant-response');
        }
        for (const pencilsPerBox of [0, Number.MAX_SAFE_INTEGER]) {
            const source = {...inputOf(box()), attribute: {kind: 'sealed-pencil-count', pencilsPerBox}} satisfies StatisticalInvestigationInput;
            const result = buildStatisticalQuestionsProblem([source]);
            expect(result.investigations[0].responseDomain).toEqual({kind: 'numeric', values: [q(pencilsPerBox)]});
            expect(isStatisticalQuestionsProblem(result)).toBe(true);
        }
    });

    it('accepts reordered registries/domains and alternative coherent indexed possibility evidence', () => {
        const value = die();
        const source = value.investigations[0], plan = source.observationPlan;
        plan.occasions = nonempty([...plan.occasions].reverse());
        plan.indices = nonempty([...plan.indices].reverse());
        source.responseDomain = {kind: 'numeric', values: [q(6), q(5), q(4), q(3), q(2), q(1)]};
        source.variability = {kind: 'anticipated-variation', possibilities: [
            {observationId: 'next', response: {kind: 'numeric', value: q(4)}},
            {observationId: 'first', response: {kind: 'numeric', value: q(2)}}]};
        expect(isStatisticalQuestionsProblem(value)).toBe(true);
        const choices = buildStatisticalQuestionsProblem([{...inputOf(color()), occasions: [
            {id: 'a', name: 'First'}, {id: 'b', name: 'Second'}]}]);
        const pupil = choices.investigations[0];
        pupil.attribute = {kind: 'color-choice', alternatives: ['blue', 'red']};
        pupil.responseDomain = {kind: 'categorical', values: ['red', 'blue']};
        pupil.variability = {kind: 'anticipated-variation', possibilities: [
            {observationId: pupil.observationPlan.indices[1].id, response: {kind: 'categorical', value: 'red'}},
            {observationId: pupil.observationPlan.indices[0].id, response: {kind: 'categorical', value: 'blue'}}]};
        expect(isStatisticalQuestionsProblem(choices)).toBe(true);
        const boxes = box();
        boxes.investigations[0].observationPlan.units = nonempty([...boxes.investigations[0].observationPlan.units].reverse());
        expect(isStatisticalQuestionsProblem(boxes)).toBe(true);
    });

    it('accepts either fixed certificate for a one-index singleton domain and repeated fixed classes', () => {
        const input = inputOf(box());
        input.units = [input.units[0]];
        const single = buildStatisticalQuestionsProblem([input]);
        const source = single.investigations[0];
        expect(source.variability.kind).toBe('single-observation');
        source.variability = {kind: 'constant-response', response: {kind: 'numeric', value: q(12)}};
        expect(isStatisticalQuestionsProblem(single)).toBe(true);
        const repeated = Array.from({length: 9}, (_, index) => ({...input, id: `fixed-${index}`}));
        expect(isStatisticalQuestionsProblem(buildStatisticalQuestionsProblem([repeated[0], ...repeated.slice(1)]))).toBe(true);
    });

    it('copies source inputs without aliasing or mutation and has no canonical allocation cap', () => {
        const source = inputOf(color());
        const before = clone(source);
        Object.freeze(source.units[0]); Object.freeze(source.occasions[0]); Object.freeze(source.attribute);
        const result = buildStatisticalQuestionsProblem([source]);
        result.investigations[0].observationPlan.units[0].name = 'Different';
        result.investigations[0].observationPlan.occasions[0].name = 'Different';
        if (result.investigations[0].attribute.kind === 'color-choice') result.investigations[0].attribute.alternatives = ['green', 'purple'];
        expect(source).toEqual(before);
        const wide: StatisticalInvestigationInput = {...dieInput(),
            units: nonempty(Array.from({length: 25}, (_, index) => ({id: `d-${index}`, name: `Die ${index}`, kind: 'die' as const}))),
            occasions: nonempty(Array.from({length: 18}, (_, index) => ({id: `t-${index}`, name: `Trial ${index}`})))};
        const broad = buildStatisticalQuestionsProblem([wide]);
        expect(broad.investigations[0].observationPlan.indices).toHaveLength(450);
        expect(isStatisticalQuestionsProblem(broad)).toBe(true);
    });

    it('rejects unsupported attributes, false domain rules, coercion and noncanonical numeric data', () => {
        invalid(die(), [
            x => x.investigations[0].attribute = {}, x => x.investigations[0].attribute.kind = 'other',
            x => x.investigations[0].attribute.die = 'four-sided', x => delete x.investigations[0].attribute.die,
            x => x.investigations[0].responseDomain = {}, x => x.investigations[0].responseDomain.kind = 'categorical',
            x => x.investigations[0].responseDomain.values.pop(), x => x.investigations[0].responseDomain.values.push(q(7)),
            x => x.investigations[0].responseDomain.values[5] = q(5),
            x => x.investigations[0].responseDomain.values[0] = {numerator: 2, denominator: 2},
            x => x.investigations[0].responseDomain.values[0] = {numerator: 1, denominator: 0},
            x => x.investigations[0].responseDomain.values[0] = {numerator: -0, denominator: 1},
            x => x.investigations[0].responseDomain.values[0] = '1',
            x => x.investigations[0].responseDomain.values[0] = q(-1),
            x => x.investigations[0].attribute.kind = {toString: () => 'upper-face-number'}
        ]);
        invalid(color(), [
            x => x.investigations[0].attribute.alternatives = ['red'],
            x => x.investigations[0].attribute.alternatives = ['red', 'red'],
            x => x.investigations[0].attribute.alternatives = ['red', 'pink'],
            x => x.investigations[0].attribute.alternatives = ['red', new String('blue')],
            x => x.investigations[0].responseDomain.values = ['red', 'green'],
            x => x.investigations[0].responseDomain.values = ['red', 'red']
        ]);
        for (const pencilsPerBox of [-1, -0, 1.5, Number.MAX_SAFE_INTEGER + 1, '12', NaN, Infinity]) {
            expect(isStatisticalQuestionsProblem(mutate(box(), x => x.investigations[0].attribute.pencilsPerBox = pencilsPerBox))).toBe(false);
        }
        const shapes = buildStatisticalQuestionsProblem([{id: 's', populationName: 'Shapes', units: [{id: 's', name: 'Shape', kind: 'rectangle'}],
            occasions: [{id: 'o', name: 'Now'}], attribute: {kind: 'side-count', shape: 'rectangle'}}]);
        invalid(shapes, [x => x.investigations[0].attribute.shape = 'square', x => x.investigations[0].responseDomain.values = [q(3)]]);
    });

    it('rejects incomplete, duplicate or mislinked units × occasions and false count witnesses', () => {
        invalid(die(), [
            x => x.investigations[0].observationPlan.populationName = ' ',
            x => x.investigations[0].observationPlan.units = [], x => x.investigations[0].observationPlan.occasions = [],
            x => x.investigations[0].observationPlan.indices = [],
            x => x.investigations[0].observationPlan.units[0].id = '',
            x => x.investigations[0].observationPlan.units[0].name = null,
            x => x.investigations[0].observationPlan.units[0].kind = 'person',
            x => x.investigations[0].observationPlan.occasions[1].id = 'm',
            x => x.investigations[0].observationPlan.occasions[0].name = '',
            x => x.investigations[0].observationPlan.observationCount = '2',
            x => x.investigations[0].observationPlan.observationCount = -0,
            x => x.investigations[0].observationPlan.observationCount = 3,
            x => x.investigations[0].observationPlan.indices.pop(),
            x => x.investigations[0].observationPlan.indices[1].id = 'first',
            x => x.investigations[0].observationPlan.indices[1].id = '',
            x => x.investigations[0].observationPlan.indices[1].unitId = 'foreign',
            x => x.investigations[0].observationPlan.indices[1].occasionId = 'foreign',
            x => x.investigations[0].observationPlan.indices[1].occasionId = 'm',
            x => delete x.investigations[0].observationPlan.indices[1].occasionId,
            x => {x.investigations[0].observationPlan.observationCount = 1; x.investigations[0].observationPlan.indices.pop();}
        ]);
        invalid(box(), [x => x.investigations[0].observationPlan.units[1].id = 'left']);
    });

    it('rejects every false classification certificate without inspecting realized samples', () => {
        invalid(die(), [
            x => x.investigations[0].variability = {}, x => x.investigations[0].variability.kind = 'statistical',
            x => x.investigations[0].variability = {kind: 'single-observation', observationId: 'first'},
            x => x.investigations[0].variability = {kind: 'constant-response', response: {kind: 'numeric', value: q(1)}},
            x => x.investigations[0].variability.possibilities.pop(),
            x => x.investigations[0].variability.possibilities.push(x.investigations[0].variability.possibilities[0]),
            x => delete x.investigations[0].variability.possibilities,
            x => x.investigations[0].variability.possibilities[1].observationId = 'first',
            x => x.investigations[0].variability.possibilities[1].observationId = 'foreign',
            x => x.investigations[0].variability.possibilities[1].observationId = 1,
            x => x.investigations[0].variability.possibilities[1].response.value = q(1),
            x => x.investigations[0].variability.possibilities[1].response.value = q(7),
            x => x.investigations[0].variability.possibilities[1].response = {kind: 'categorical', value: 'red'},
            x => x.investigations[0].variability.possibilities[1].response = {},
            x => x.investigations[0].variability.possibilities[1] = null
        ]);
        invalid(color(), [x => x.investigations[0].variability.observationId = 'wrong',
            x => x.investigations[0].variability = {kind: 'anticipated-variation', possibilities: [
                {observationId: 'one', response: {kind: 'categorical', value: 'red'}}, {observationId: 'one', response: {kind: 'categorical', value: 'blue'}}]}]);
        invalid(box(), [x => x.investigations[0].variability.response.value = q(13),
            x => x.investigations[0].variability = {kind: 'anticipated-variation', possibilities: [
                {observationId: 'a', response: {kind: 'numeric', value: q(12)}}, {observationId: 'b', response: {kind: 'numeric', value: q(12)}}]}]);
        const repeated = buildStatisticalQuestionsProblem([{...inputOf(color()), occasions: [{id: 'a', name: 'A'}, {id: 'b', name: 'B'}]}]);
        invalid(repeated, [x => x.investigations[0].variability.possibilities[1].response.value = 'red',
            x => x.investigations[0].variability.possibilities[1].response.value = 'green']);
    });

    it('is total for sparse/inherited arrays, cycles, accessors and hostile proxies', () => {
        const sparse: unknown[] = []; sparse.length = 0xffff_ffff;
        const inherited = [, die().investigations[0]];
        Object.setPrototypeOf(inherited, {0: die().investigations[0]});
        const cyclic: Record<string, unknown> = {kind: 'statistical-questions'}; cyclic.investigations = cyclic;
        const throws = new Proxy({}, {getOwnPropertyDescriptor: () => {throw Error('hostile');}});
        let reads = 0;
        const getter = Object.defineProperty({investigations: die().investigations}, 'kind', {get: () => {reads++; return 'statistical-questions';}});
        for (const value of [undefined, null, 0, 'question', [], {}, {kind: 'wrong', investigations: []},
            {kind: 'statistical-questions', investigations: sparse}, {kind: 'statistical-questions', investigations: inherited}, cyclic, throws, getter,
            mutate(die(), x => {delete x.investigations[0].observationPlan.indices[0];}),
            mutate(die(), x => {delete x.investigations[0].responseDomain.values[0];}),
            mutate(die(), x => {delete x.investigations[0].variability.possibilities[0];})]) {
            expect(isStatisticalQuestionsProblem(value)).toBe(false);
        }
        expect(reads).toBe(0);
        const numeratorGetter = mutate(die(), x => Object.defineProperty(x.investigations[0].responseDomain.values[0], 'numerator', {get: () => {throw Error('no');}}));
        expect(isStatisticalQuestionsProblem(numeratorGetter)).toBe(false);
        invalid(die(), [x => x.investigations[0].id = '', x => x.investigations.push(clone(x.investigations[0])),
            x => x.investigations[0].observationPlan = [], x => x.investigations[0].attribute = null]);
    });

    it('throws GeneratorValidationError for malformed builder inputs without substituting defaults', () => {
        const throws = new Proxy({}, {getOwnPropertyDescriptor: () => {throw Error('bad');}});
        const invalidInputs: unknown[] = [undefined, {}, [], new Array(4), [throws], [null], [dieInput(), dieInput()],
            [{...dieInput(), id: ''}], [{...dieInput(), populationName: ''}], [{...dieInput(), attribute: {kind: 'unknown'}}],
            [{...dieInput(), units: []}], [{...dieInput(), occasions: []}],
            [{...dieInput(), units: [{id: 'x', name: 'Wrong', kind: 'person'}]}],
            [{...dieInput(), units: [{id: 'd', name: 'First', kind: 'die'}, {id: 'd', name: 'Second', kind: 'die'}]}],
            [{...dieInput(), occasions: [{id: 'x', name: ''}]}],
            [{...dieInput(), occasions: [{id: 'x', name: 'A'}, {id: 'x', name: 'B'}]}]];
        for (const value of invalidInputs) expect(() => invalidBuild(value)).toThrow(GeneratorValidationError);
    });

    it('rejects an unrepresentable complete Cartesian registry before allocating its product', () => {
        const source: StatisticalInvestigationInput = {...dieInput(),
            units: nonempty(Array.from({length: 65536}, (_, index) => ({id: `d${index}`, name: 'Die', kind: 'die' as const}))),
            occasions: nonempty(Array.from({length: 65536}, (_, index) => ({id: `t${index}`, name: 'Trial'})))};
        expect(() => buildStatisticalQuestionsProblem([source])).toThrow('complete observation-index array is not representable');
    });
});
