import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {IntegerRoundingGenerator} from './generator.ts';

describe('IntegerRoundingGenerator', () => {
    const generator = new IntegerRoundingGenerator();

    it('strictly validates configuration', () => {
        expect(() => generator.generate({})).toThrow();
    });

    it.each([
        [Scope.StepsOf10, 10],
        [Scope.StepsOf100, 100]
    ] as const)('rounds using %s', (roundingMagnitude, roundingPlace) => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({
                range: {min: 0, max: 1000},
                roundingMagnitude
            })!.data;

            expect(data.roundingPlace).toBe(roundingPlace);
            expect(data.number).toBeGreaterThan(data.lowerMultiple);
            expect(data.number).toBeLessThan(data.upperMultiple);
            expect(data.midpoint).toBe((data.lowerMultiple + data.upperMultiple) / 2);
            expect(data.distanceLower).toBe(data.number - data.lowerMultiple);
            expect(data.distanceUpper).toBe(data.upperMultiple - data.number);
            expect(data.roundedValue).toBe(Math.round(data.number / roundingPlace) * roundingPlace);
            expect(data.isMidpointTie).toBe(data.number === data.midpoint);
            expect('task' in data).toBe(false);
        }
    });

    it.each([
        [Scope.StepsOf10, 10, 'ten'],
        [Scope.StepsOf100, 100, 'hundred'],
        [Scope.StepsOf1000, 1000, 'thousand'],
        [Scope.StepsOf10000, 10000, 'ten-thousand'],
        [Scope.StepsOf100000, 100000, 'hundred-thousand']
    ] as const)('supplies Grade 4 rounding evidence using %s', (
        roundingMagnitude,
        roundingPlace,
        roundingPlaceName
    ) => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({
                range: {min: 1000, max: 1_000_000},
                roundingMagnitude
            })!.data;

            expect('task' in data && data.task).toBe('multi-digit-integer-rounding');
            if (!('task' in data) || data.task !== 'multi-digit-integer-rounding') continue;
            expect(data.roundingPlace).toBe(roundingPlace);
            expect(data.roundingPlaceName).toBe(roundingPlaceName);
            expect(data.number).toBeGreaterThanOrEqual(1000);
            expect(data.number).toBeLessThanOrEqual(1_000_000);
            expect(data.upperMultiple - data.lowerMultiple).toBe(roundingPlace);
            expect(data.midpoint).toBe((data.lowerMultiple + data.upperMultiple) / 2);
            expect(data.number).toBeGreaterThan(data.lowerMultiple);
            expect(data.number).toBeLessThan(data.upperMultiple);
            expect(data.distanceLower).toBe(data.number - data.lowerMultiple);
            expect(data.distanceUpper).toBe(data.upperMultiple - data.number);
            expect(data.roundedValue)
                .toBe(Math.round(data.number / roundingPlace) * roundingPlace);
            expect(data.questionEquation).toMatch(/ → \?$/);
            expect(data.solutionEquation).toContain(' → ');
        }
    });

    it.each([
        [Scope.StepsOf10, 10],
        [Scope.StepsOf100, 100],
        [Scope.StepsOf1000, 1000],
        [Scope.StepsOf10000, 10000],
        [Scope.StepsOf100000, 100000]
    ] as const)('keeps Grade 4 sources visibly separate from the %s midpoint', (
        roundingMagnitude,
        roundingPlace
    ) => {
        const minimumMidpointDistance = Math.ceil(roundingPlace * 0.05);
        let sawMidpointTie = false;
        let sawNonTie = false;

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const data = generator.generate({
                range: {min: 1000, max: 1_000_000},
                roundingMagnitude
            })!.data;
            if (!('task' in data)) continue;

            if (data.isMidpointTie) {
                sawMidpointTie = true;
                expect(data.number).toBe(data.midpoint);
            } else {
                sawNonTie = true;
                expect(Math.abs(data.number - data.midpoint))
                    .toBeGreaterThanOrEqual(minimumMidpointDistance);
            }
        }

        expect(sawMidpointTie).toBe(true);
        expect(sawNonTie).toBe(true);

        const lowerMultiple = roundingPlace < 1000 ? 1000 : roundingPlace;
        const midpoint = lowerMultiple + roundingPlace / 2;
        const tie = generator.generate({
            range: {min: midpoint, max: midpoint},
            roundingMagnitude
        })!.data;
        expect(tie).toMatchObject({
            task: 'multi-digit-integer-rounding',
            number: midpoint,
            midpoint,
            isMidpointTie: true
        });

        if (minimumMidpointDistance > 1) {
            const obscuredNonTie = midpoint + minimumMidpointDistance - 1;
            expect(generator.generate({
                range: {min: obscuredNonTie, max: obscuredNonTie},
                roundingMagnitude
            })).toBeNull();
        }
    });

    it('supplies an explicit midpoint rule and grouped non-tie distances', () => {
        const tie = generator.generate({
            range: {min: 1500, max: 1500},
            roundingMagnitude: Scope.StepsOf1000
        })!.data;
        expect(tie).toMatchObject({
            task: 'multi-digit-integer-rounding',
            number: 1500,
            lowerMultiple: 1000,
            midpoint: 1500,
            upperMultiple: 2000,
            roundedValue: 2000,
            direction: 'up',
            isMidpointTie: true,
            decisionExplanation: '1,500 is exactly halfway between 1,000 and 2,000, so it rounds up to 2,000.'
        });

        const nonTie = generator.generate({
            range: {min: 123456, max: 123456},
            roundingMagnitude: Scope.StepsOf100000
        })!.data;
        expect(nonTie).toMatchObject({
            task: 'multi-digit-integer-rounding',
            distanceLower: 23456,
            distanceUpper: 76544,
            prompt: 'Round 123,456 to the nearest hundred thousand.',
            questionEquation: '123,456 → ?',
            solutionEquation: '123,456 → 100,000',
            roundingStatement: '123,456 rounded to the nearest hundred thousand is 100,000.',
            decisionExplanation: '123,456 is 23,456 from 100,000 and 76,544 from 200,000, so it rounds down to 100,000.'
        });

        const lowerBand = generator.generate({
            range: {min: 1000, max: 1000},
            roundingMagnitude: Scope.StepsOf100000
        })!.data;
        expect(lowerBand).toMatchObject({
            task: 'multi-digit-integer-rounding',
            number: 1000,
            lowerMultiple: 0,
            upperMultiple: 100000,
            roundedValue: 0
        });
    });

    it('includes the upper million boundary and is deterministic', () => {
        const config = {
            range: {min: 999999, max: 999999},
            roundingMagnitude: Scope.StepsOf100000
        } as const;
        setSeed('integer-rounding-grade-four');
        const first = generator.generate(config);
        setSeed('integer-rounding-grade-four');
        expect(generator.generate(config)).toEqual(first);
        expect(first!.data).toMatchObject({
            task: 'multi-digit-integer-rounding',
            number: 999999,
            upperMultiple: 1_000_000,
            roundedValue: 1_000_000
        });
    });

    it('returns null for unsupported magnitudes and unusable ranges', () => {
        expect(generator.generate({
            range: {min: 0, max: 1000},
            roundingMagnitude: 'unsupported'
        } as never)).toBeNull();
        expect(generator.generate({
            range: {min: 995, max: 1000},
            roundingMagnitude: Scope.StepsOf100
        })).toBeNull();
        expect(generator.generate({
            range: {min: 1_000_001, max: 1_000_001},
            roundingMagnitude: Scope.StepsOf100000
        })).toBeNull();
        expect(generator.generate({
            range: {min: 2000, max: 2000},
            roundingMagnitude: Scope.StepsOf1000
        })).toBeNull();
    });
});
