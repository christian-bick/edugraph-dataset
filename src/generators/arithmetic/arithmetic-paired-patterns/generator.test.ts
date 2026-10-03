import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {ArithmeticPairedPatternProblem} from '../../../types/problems.ts';
import {ArithmeticPairedPatternsGenerator} from './generator.ts';

const generator = new ArithmeticPairedPatternsGenerator();

function expectExactPair(data: ArithmeticPairedPatternProblem): void {
    expect(data.kind).toBe('paired-additive-patterns');
    expect(data.first.terms).toHaveLength(6);
    expect(data.second.terms).toHaveLength(6);
    for (const sequence of [data.first, data.second]) {
        expect(sequence.rule.kind).toBe('add-constant');
        expect(Number.isSafeInteger(sequence.start)).toBe(true);
        expect(sequence.start).toBeGreaterThanOrEqual(0);
        expect(Number.isSafeInteger(sequence.rule.increment)).toBe(true);
        expect(sequence.rule.increment).toBeGreaterThan(0);
        sequence.terms.forEach((term, index) => {
            expect(term).toBe(sequence.start + index * sequence.rule.increment);
            expect(Number.isSafeInteger(term)).toBe(true);
            expect(term).toBeGreaterThanOrEqual(0);
        });
    }

    if (data.correspondence) data.first.terms.forEach((term, index) => {
        const other = data.second.terms[index];
        if (data.correspondence?.kind === 'multiplicative') {
            expect(data.correspondence.factor).toBeGreaterThan(1);
            expect(other).toBe(term * data.correspondence.factor);
        } else if (data.correspondence?.kind === 'additive') {
            expect(data.correspondence.difference).toBeGreaterThan(0);
            expect(other).toBe(term + data.correspondence.difference);
        }
    });
    expect(data).not.toHaveProperty('prompt');
    expect(data).not.toHaveProperty('blankIndex');
    expect(data).not.toHaveProperty('explanation');
}

describe('ArithmeticPairedPatternsGenerator', () => {
    it('strictly validates configuration', () => {
        expect(() => generator.generate({})).toThrow();
        expect(generator.generate({hasCorrespondence: 'unsupported'} as never)).toBeNull();
    });

    it('generates aligned recurrences with exact additive and multiplicative witnesses when requested', () => {
        const relationKinds = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({hasCorrespondence: true})!.data;
            expectExactPair(data);
            expect(data.correspondence).toBeDefined();
            relationKinds.add(data.correspondence!.kind);
        }
        expect(relationKinds).toEqual(new Set(['multiplicative', 'additive']));
    });

    it('generates paired recurrences without a required correspondence witness', () => {
        const observed = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({hasCorrespondence: false})!.data;
            expectExactPair(data);
            expect(data.correspondence).toBeUndefined();
            observed.add(`${data.first.start}/${data.first.rule.increment}:${data.second.start}/${data.second.rule.increment}`);
        }
        expect(observed.size).toBeGreaterThan(20);
    });

    it('supports the source-standard add-3/add-6 example from zero', () => {
        const examples: ArithmeticPairedPatternProblem[] = [];
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            examples.push(generator.generate({hasCorrespondence: false})!.data);
        }
        expect(examples).toContainEqual({
            kind: 'paired-additive-patterns',
            first: {start: 0, rule: {kind: 'add-constant', increment: 3}, terms: [0, 3, 6, 9, 12, 15]},
            second: {start: 0, rule: {kind: 'add-constant', increment: 6}, terms: [0, 6, 12, 18, 24, 30]}
        });
    });

    it('replays the same pair for the same seed', () => {
        setSeed(88);
        const first = generator.generate({hasCorrespondence: true})!.data;
        setSeed(88);
        expect(generator.generate({hasCorrespondence: true})!.data).toEqual(first);
    });
});
