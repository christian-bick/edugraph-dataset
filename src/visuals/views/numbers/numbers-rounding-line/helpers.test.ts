import {describe, expect, it} from 'vitest';
import {IntegerRoundingProblem, MultiDigitIntegerRoundingProblem} from '../../../../types/problems.ts';
import {
    displayRoundingPlace,
    getPointLabelX,
    getSourceScaleCue,
    isValidLegacyRoundingProblem,
    isValidMultiDigitRoundingProblem,
    multiDigitRoundingPresentation
} from './helpers.ts';

const gradeFourProblem: MultiDigitIntegerRoundingProblem = {
    task: 'multi-digit-integer-rounding',
    number: 347650,
    roundingPlace: 10000,
    lowerMultiple: 340000,
    midpoint: 345000,
    upperMultiple: 350000,
    roundedValue: 350000,
    direction: 'up',
    distanceLower: 7650,
    distanceUpper: 2350,
    isMidpointTie: false
};

describe('numbers-rounding-line helpers', () => {
    it('preserves coherent legacy rounding payloads', () => {
        const legacy: IntegerRoundingProblem = {
            number: 345,
            roundingPlace: 100,
            lowerMultiple: 300,
            midpoint: 350,
            upperMultiple: 400,
            roundedValue: 300,
            direction: 'down',
            distanceLower: 45,
            distanceUpper: 55,
            isMidpointTie: false
        };

        expect(isValidLegacyRoundingProblem(legacy)).toBe(true);
        expect(isValidMultiDigitRoundingProblem(legacy)).toBe(false);
    });

    it('validates the complete Grade 4 payload and derives its presentation', () => {
        expect(isValidMultiDigitRoundingProblem(gradeFourProblem)).toBe(true);
        expect(isValidLegacyRoundingProblem(gradeFourProblem)).toBe(false);
        expect(multiDigitRoundingPresentation(gradeFourProblem)).toEqual({
            prompt: 'Round 347,650 to the nearest ten thousand.',
            questionEquation: '347,650 → ?',
            solutionEquation: '347,650 → 350,000',
            roundingStatement: '347,650 rounded to the nearest ten thousand is 350,000.',
            decisionExplanation: '347,650 is 7,650 from 340,000 and 2,350 from 350,000, so it rounds up to 350,000.'
        });
    });

    it('validates midpoint ties at the hundred-thousand boundary', () => {
        const tie: MultiDigitIntegerRoundingProblem = {
            task: 'multi-digit-integer-rounding',
            number: 850000,
            roundingPlace: 100000,
            lowerMultiple: 800000,
            midpoint: 850000,
            upperMultiple: 900000,
            roundedValue: 900000,
            direction: 'up',
            distanceLower: 50000,
            distanceUpper: 50000,
            isMidpointTie: true
        };

        expect(isValidMultiDigitRoundingProblem(tie)).toBe(true);
    });

    it.each([
        ['wrong midpoint', {...gradeFourProblem, midpoint: 346000}],
        ['wrong rounded value', {...gradeFourProblem, roundedValue: 340000}]
    ])('rejects %s', (_description, invalid) => {
        expect(isValidMultiDigitRoundingProblem(invalid as MultiDigitIntegerRoundingProblem)).toBe(false);
    });

    it('renders stable place-name slugs as readable text', () => {
        expect(displayRoundingPlace(100000)).toBe('hundred thousand');
    });

    it('offsets near-midpoint point labels toward their dot and clamps line ends', () => {
        expect(getPointLabelX(405, 390)).toBe(487);
        expect(getPointLabelX(375, 390)).toBe(293);
        expect(getPointLabelX(550, 390)).toBe(550);
        expect(getPointLabelX(50, 390)).toBe(94);
        expect(getPointLabelX(710, 390)).toBe(666);
    });

    it('identifies the adjacent labeled scale ticks around a source point', () => {
        expect(getSourceScaleCue(7291, 0, 10000)).toEqual({
            kind: 'between',
            lowerTick: 7000,
            upperTick: 8000
        });
        expect(getSourceScaleCue(365380, 360000, 10000)).toEqual({
            kind: 'between',
            lowerTick: 365000,
            upperTick: 366000
        });
        expect(getSourceScaleCue(365000, 360000, 10000)).toEqual({
            kind: 'exact-tick',
            tick: 365000
        });
    });
});
