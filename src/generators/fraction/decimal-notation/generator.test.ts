import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {DecimalNotationProblem} from '../../../types/problems.ts';
import {DecimalNotationGenerator} from './generator.ts';

const generator = new DecimalNotationGenerator();

const expectCanonicalProblem = (problem: DecimalNotationProblem): void => {
    const {value} = problem;
    const {numerator, denominator} = value;

    expect(problem).toEqual({
        task: 'decimal-notation',
        sharedWhole: 1,
        relation: 'equal',
        value: {
            numerator,
            denominator,
            wholeDigit: 0,
            tenthsDigit: denominator === 10 ? numerator : Math.floor(numerator / 10),
            hundredthsDigit: denominator === 10 ? null : numerator % 10,
            hundredthsNumerator: denominator === 10 ? numerator * 10 : numerator
        }
    });
    expect(numerator).toBeGreaterThan(0);
    expect(numerator).toBeLessThan(denominator);
    if (denominator === 100) expect(numerator % 10).not.toBe(0);
    expect(numerator * 100).toBe(value.hundredthsNumerator * denominator);
};

describe('DecimalNotationGenerator', () => {
    it('validates its invariant empty configuration', () => {
        expect(() => generator.generate(null as never)).toThrow('Configuration object');
        expect(() => generator.generate({unexpected: true} as never))
            .toThrow('does not accept configuration fields');
    });

    it('generates canonical tenths and nontrivial hundredths values', () => {
        const denominators = new Set<number>();
        let sawLeadingZero = false;
        let sawHighHundredths = false;
        for (let seed = 0; seed < 300; seed++) {
            setSeed(`decimal-notation-${seed}`);
            const problem = generator.generate({}).data;
            expectCanonicalProblem(problem);
            denominators.add(problem.value.denominator);
            sawLeadingZero ||= problem.value.denominator === 100
                && problem.value.numerator < 10;
            sawHighHundredths ||= problem.value.denominator === 100
                && problem.value.numerator > 90;
        }
        expect(denominators).toEqual(new Set([10, 100]));
        expect(sawLeadingZero).toBe(true);
        expect(sawHighHundredths).toBe(true);
    });

    it('is deterministic for the same repository seed', () => {
        setSeed('decimal-notation-determinism');
        const first = generator.generate({});
        setSeed('decimal-notation-determinism');
        expect(generator.generate({})).toEqual(first);
    });
});
