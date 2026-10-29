import {afterEach, describe, expect, it, vi} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import * as rng from '../../../lib/random.ts';
import {sampleOrderedContextPair} from '../ordered-context-helpers.ts';
import {buildRationalOrderContextProblem, RationalOrderContextsGenerator} from './generator.ts';

const generator = new RationalOrderContextsGenerator();
afterEach(() => vi.restoreAllMocks());

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
        expect(() => generator.generate({relation: 'less', signDomain: 'unrestricted'} as never))
            .toThrow(GeneratorValidationError);
    });

    it('preserves every original sign-pattern branch through the existing conditional sampler', () => {
        const draw = vi.spyOn(rng, 'random');
        for (let pattern = 0; pattern < 5; pattern++) {
            for (const edge of [0, 0.5, 1 - Number.EPSILON]) {
                const oldDraws = [edge, edge, (pattern + 0.5) / 5, edge, edge, edge];
                draw.mockImplementation(() => oldDraws.shift()!);
                const before = sampleOrderedContextPair('unrestricted');
                const newDraws = pattern === 4 ? [edge, edge, edge, edge, edge]
                    : [edge, edge, (pattern + 0.5) / 4, edge, edge, edge];
                draw.mockImplementation(() => newDraws.shift()!);
                const after = generator.generate({relation: before.relation,
                    signDomain: pattern === 4 ? 'nonnegative' : 'signed'});
                expect(after.data).toEqual({kind: 'rational-order-contexts', ...before});
            }
        }
    });

    it.each(['less', 'greater'] as const)('constructively realizes %s for both declared sign domains', relation => {
        const kinds = new Set<string>();
        const signs = new Set<number>();
        for (const signDomain of ['signed', 'nonnegative'] as const) for (let seed = 0; seed < 500; seed++) {
            setSeed(seed);
            const stub = generator.generate({relation, signDomain});
            expect(Object.keys(stub)).toEqual(['data']);
            const data = stub.data;
            expect(data.relation).toBe(relation);
            const left = BigInt(data.first.value.numerator) * BigInt(data.second.value.denominator);
            const right = BigInt(data.second.value.numerator) * BigInt(data.first.value.denominator);
            expect(left < right).toBe(relation === 'less');
            expect(data.first.id).toBe('A');
            expect(data.second.id).toBe('B');
            expect([data.first.sign, data.second.sign].includes(-1)).toBe(signDomain === 'signed');
            kinds.add(data.context.kind);
            signs.add(data.first.sign);
            signs.add(data.second.sign);
        }
        expect([...kinds].sort()).toEqual(['balance', 'elevation', 'temperature']);
        expect([...signs].sort()).toEqual([-1, 0, 1]);
    });

    it('replays exact data without an instruction, ontology labels or task field', () => {
        setSeed(251);
        const first = generator.generate({relation: 'less', signDomain: 'signed'});
        setSeed(251);
        expect(generator.generate({relation: 'less', signDomain: 'signed'})).toEqual(first);
        expect(Object.keys(first.data)).toEqual(['kind', 'context', 'first', 'second', 'relation']);
    });
});
