import {describe, expect, it} from 'vitest';
import type {DecimalRoundingPlace} from '../../../../types/problems.ts';
import {roundingCase} from './fixtures.ts';
import {
    formatTenThousandths,
    LINE_LEFT,
    LINE_RIGHT,
    linePosition,
    placeFractionDigits,
    roundingExplanation,
    sourceBadgeX,
    validDecimalRounding
} from './helpers.ts';

const places: readonly DecimalRoundingPlace[] = [
    {name: 'hundreds', quantumInTenThousandths: 1000000},
    {name: 'tens', quantumInTenThousandths: 100000},
    {name: 'ones', quantumInTenThousandths: 10000},
    {name: 'tenths', quantumInTenThousandths: 1000},
    {name: 'hundredths', quantumInTenThousandths: 100},
    {name: 'thousandths', quantumInTenThousandths: 10}
];

describe('decimal rounding line evidence', () => {
    it('accepts all six requested places, including whole places with a decimal input', () => {
        for (const place of places) {
            const data = roundingCase(place, 0, Math.floor(place.quantumInTenThousandths / 4) + 1);
            expect(validDecimalRounding(data)).toBe(true);
        }
    });

    it('formats fixed-scale values and retained result places exactly', () => {
        expect(formatTenThousandths(99950)).toBe('9.995');
        expect(formatTenThousandths(100000, 2)).toBe('10.00');
        expect(formatTenThousandths(10, 3)).toBe('0.001');
        expect(formatTenThousandths(0, 3)).toBe('0.000');
        expect(placeFractionDigits(places[0]!)).toBe(0);
        expect(placeFractionDigits(places[5]!)).toBe(3);
    });

    it('places the source by exact ratio and clamps only its badge', () => {
        const data = roundingCase({name: 'hundredths', quantumInTenThousandths: 100}, 99900, 99901);
        expect(linePosition(data, data.lowerCandidateInTenThousandths)).toBe(LINE_LEFT);
        expect(linePosition(data, data.upperCandidateInTenThousandths)).toBe(LINE_RIGHT);
        expect(linePosition(data, data.inputInTenThousandths)).toBeCloseTo(LINE_LEFT + 6.2);
        expect(sourceBadgeX(linePosition(data, data.inputInTenThousandths))).toBe(190);
        expect(sourceBadgeX(LINE_RIGHT - 1)).toBe(610);
        expect(sourceBadgeX(linePosition(data, data.midpointInTenThousandths))).toBe(400);
    });

    it('rejects incorrect candidate, place, distance, tie, or rounded result', () => {
        const data = roundingCase({name: 'hundredths', quantumInTenThousandths: 100}, 99900, 99950);
        expect(validDecimalRounding(data)).toBe(true);
        expect(validDecimalRounding({...data, upperCandidateInTenThousandths: 100100})).toBe(false);
        expect(validDecimalRounding({...data, roundingPlace: {name: 'hundredths', quantumInTenThousandths: 10} as unknown as DecimalRoundingPlace})).toBe(false);
        expect(validDecimalRounding({...data, distanceToLowerInTenThousandths: 49})).toBe(false);
        expect(validDecimalRounding({...data, isMidpointTie: false})).toBe(false);
        expect(validDecimalRounding({...data, roundedInTenThousandths: data.lowerCandidateInTenThousandths})).toBe(false);
        expect(validDecimalRounding({...data, inputInTenThousandths: 100000})).toBe(false);
    });

    it('explains upward ties and nearest choices using adjacent decimal numerals', () => {
        const tie = roundingCase({name: 'hundredths', quantumInTenThousandths: 100}, 99900, 99950);
        expect(roundingExplanation(tie)).toBe('9.995 is halfway between 9.99 and 10.00, so round up to 10.00.');
        const nearest = roundingCase({name: 'thousandths', quantumInTenThousandths: 10}, 0, 1);
        expect(roundingExplanation(nearest)).toBe('0.0001 is 0.0001 from 0.000 and 0.0009 from 0.001, so round down to 0.000.');
    });
});
