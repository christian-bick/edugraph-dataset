import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {buildRationalOrderContextProblem, RationalOrderContextsGenerator} from './generator.ts';

const generator = new RationalOrderContextsGenerator();

describe('exact contextual strict order', () => {
    it('preserves negative physical values and swaps nominal roles without losing the datum', () => {
        const first = {numerator: -7, denominator: 2};
        const second = {numerator: -5, denominator: 2};
        const pair = buildRationalOrderContextProblem('temperature', first, second);
        expect(pair).toEqual({kind: 'rational-order-contexts',
            context: {kind: 'temperature', reference: 'celsius-zero', unit: 'degrees-celsius'},
            first: {id: 'A', value: first, magnitude: {numerator: 7, denominator: 2}, sign: -1},
            second: {id: 'B', value: second, magnitude: {numerator: 5, denominator: 2}, sign: -1}, relation: 'less'});
        expect(buildRationalOrderContextProblem('temperature', second, first).relation).toBe('greater');
        expect(() => buildRationalOrderContextProblem('temperature', first, first)).toThrow(GeneratorValidationError);
    });

    it('rejects empty, missing and unsupported required mathematical configurations', () => {
        for (const config of [{}, null, undefined, {relation: null}, {relation: []}, {relation: 'equal'}, {relation: 'interpret'}, {relation: 1}]) {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });

    it.each(['less', 'greater'] as const)('constructively realizes %s for the complete seeded contextual corpus', relation => {
        const kinds = new Set<string>();
        const signs = new Set<number>();
        for (let seed = 0; seed < 1000; seed++) {
            setSeed(seed);
            const stub = generator.generate({relation});
            expect(Object.keys(stub)).toEqual(['data']);
            const data = stub.data;
            expect(data.relation).toBe(relation);
            const left = BigInt(data.first.value.numerator) * BigInt(data.second.value.denominator);
            const right = BigInt(data.second.value.numerator) * BigInt(data.first.value.denominator);
            expect(left < right).toBe(relation === 'less');
            expect(data.first.id).toBe('A');
            expect(data.second.id).toBe('B');
            kinds.add(data.context.kind);
            signs.add(data.first.sign);
            signs.add(data.second.sign);
        }
        expect([...kinds].sort()).toEqual(['balance', 'elevation', 'temperature']);
        expect([...signs].sort()).toEqual([-1, 0, 1]);
    });

    it('replays exact data without an instruction, ontology labels or task field', () => {
        setSeed(251);
        const first = generator.generate({relation: 'less'});
        setSeed(251);
        expect(generator.generate({relation: 'less'})).toEqual(first);
        expect(Object.keys(first.data)).toEqual(['kind', 'context', 'first', 'second', 'relation']);
    });
});
