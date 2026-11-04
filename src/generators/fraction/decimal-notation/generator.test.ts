import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {setSeed} from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {DecimalNotationProblem} from '../../../types/problems.ts';
import {DecimalNotationGenerator} from './generator.ts';

const generator = new DecimalNotationGenerator();
const config = (upper: 10 | 100) => ({range: createCanonicalNumericRange(upper)});
afterEach(() => vi.restoreAllMocks());

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
    it('validates its selected mathematical range before consuming entropy', () => {
        const draw = vi.spyOn(rng, 'random');
        expect(() => generator.generate(null as never)).toThrow('Configuration object');
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({...config(10), unexpected: true} as never)).toThrow('unexpected field');
        for (const range of [createCanonicalNumericRange(5), createCanonicalNumericRange(100, 5),
            {...createCanonicalNumericRange(10), maximumAbove: 0}, {...createCanonicalNumericRange(10), extra: true}])
            expect(() => generator.generate({range})).toThrow('canonical tenths or hundredths range');
        expect(draw).not.toHaveBeenCalled();
    });

    it('generates canonical tenths and nontrivial hundredths values', () => {
        const denominators = new Set<number>();
        let sawLeadingZero = false;
        let sawHighHundredths = false;
        for (let seed = 0; seed < 300; seed++) {
            setSeed(`decimal-notation-${seed}`);
            const problem = generator.generate(config(seed % 2 === 0 ? 10 : 100)).data;
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
        const first = generator.generate(config(100));
        setSeed('decimal-notation-determinism');
        expect(generator.generate(config(100))).toEqual(first);
    });

    it.each([10, 100] as const)('retains every original numerator and uniform conditional ticket under upper%s', upper => {
        const draw = vi.spyOn(rng, 'random');
        const numerators = Array.from({length: upper - 1}, (_, index) => index + 1)
            .filter(numerator => upper === 10 || numerator % 10 !== 0);
        for (const [index, numerator] of numerators.entries()) {
            draw.mockReturnValueOnce(0.37).mockReturnValueOnce((index + 0.5) / numerators.length);
            const {data} = generator.generate(config(upper));
            expectCanonicalProblem(data);
            expect(data.value.numerator).toBe(numerator);
            expect(data.value.denominator).toBe(upper);
            expect(hasCanonicalRangeWitness([numerator, upper, numerator / upper, 1], config(upper).range)).toBe(true);
        }
        expect(draw).toHaveBeenCalledTimes(2 * numerators.length);
    });

    it('preserves original seeded payloads and two-draw continuation when conditioned on the selected denominator', () => {
        const hundredths = Array.from({length: 99}, (_, i) => i + 1).filter(n => n % 10 !== 0);
        for (let seed = 0; seed < 100; seed++) {
            setSeed(`notation-legacy-${seed}`);
            const denominator = rng.random() < 0.5 ? 10 : 100;
            const ticket = rng.random();
            const numerator = denominator === 10 ? 1 + Math.floor(ticket * 9)
                : hundredths[Math.floor(ticket * hundredths.length)]!;
            const continuation = rng.random();
            setSeed(`notation-legacy-${seed}`);
            expect(generator.generate(config(denominator)).data.value).toMatchObject({numerator, denominator});
            expect(rng.random()).toBe(continuation);
        }
    });
});
