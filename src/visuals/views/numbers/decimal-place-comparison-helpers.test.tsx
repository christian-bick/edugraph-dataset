import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {DecimalPlaceComparisonProblem} from '../../../types/problems.ts';
import {createDecimalPlaceComparison} from '../../../generators/number/decimal-place-comparison/generator.ts';
import {assertDecimalPlaceComparison, COMPARISON_PLACES, comparisonPlaceUnit} from './decimal-place-comparison-helpers.ts';

const less: DecimalPlaceComparisonProblem = {
    kind: 'decimal-place-comparison', base: 10,
    left: {
        wholePart: 3, wholeDigits: [0, 0, 3], fractionalDigits: [4, 0, 7],
        displayPrecision: 3, displayNumeral: '3.407', valueInThousandths: 3407
    },
    right: {
        wholePart: 3, wholeDigits: [0, 0, 3], fractionalDigits: [4, 0, 8],
        displayPrecision: 3, displayNumeral: '3.408', valueInThousandths: 3408
    },
    relation: 'less',
    witness: {
        kind: 'first-difference', decidingPlace: 'thousandths',
        higherEqualPlaces: ['hundreds', 'tens', 'ones', 'tenths', 'hundredths'],
        leftDigit: 7, rightDigit: 8
    }
};

const equal: DecimalPlaceComparisonProblem = {
    kind: 'decimal-place-comparison', base: 10,
    left: {
        wholePart: 2, wholeDigits: [0, 0, 2], fractionalDigits: [3, 0, 0],
        displayPrecision: 1, displayNumeral: '2.3', valueInThousandths: 2300
    },
    right: {
        wholePart: 2, wholeDigits: [0, 0, 2], fractionalDigits: [3, 0, 0],
        displayPrecision: 3, displayNumeral: '2.300', valueInThousandths: 2300
    },
    relation: 'equal',
    witness: {kind: 'all-places-equal', equalPlaces: COMPARISON_PLACES}
};

const greater: DecimalPlaceComparisonProblem = {
    kind: 'decimal-place-comparison', base: 10,
    left: {
        wholePart: 4, wholeDigits: [0, 0, 4], fractionalDigits: [8, 3, 0],
        displayPrecision: 2, displayNumeral: '4.83', valueInThousandths: 4830
    },
    right: {
        wholePart: 4, wholeDigits: [0, 0, 4], fractionalDigits: [8, 2, 0],
        displayPrecision: 2, displayNumeral: '4.82', valueInThousandths: 4820
    },
    relation: 'greater',
    witness: {
        kind: 'first-difference', decidingPlace: 'hundredths',
        higherEqualPlaces: ['hundreds', 'tens', 'ones', 'tenths'],
        leftDigit: 3, rightDigit: 2
    }
};

let Core: typeof import('./numbers-decimal-place-comparison/view.tsx').NumbersDecimalPlaceComparisonCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Core = (await import('./numbers-decimal-place-comparison/view.tsx')).NumbersDecimalPlaceComparisonCore;
});
afterAll(() => vi.unstubAllGlobals());

function renderMarkup(data: DecimalPlaceComparisonProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'numbers-decimal-place-comparison'> = {
        problem: {type: 'arithmetic', data, labels: []},
        viewId: 'numbers-decimal-place-comparison', targetLabels: [], isSolutionView, seed: 4
    };
    return renderToStaticMarkup(<Core payload={payload} />);
}

function render(data: DecimalPlaceComparisonProblem, isSolutionView: boolean): string {
    return renderMarkup(data, isSolutionView)
        .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
        .replace(/&gt;/g, '>').replace(/&lt;/g, '<');
}

describe('decimal place comparison view', () => {
    it('asks for a symbol without hinting at the first differing thousandths place', () => {
        expect(() => assertDecimalPlaceComparison('test', less)).not.toThrow();
        const question = render(less, false);
        expect(question).toContain('3.407');
        expect(question).toContain('3.408');
        expect(question).not.toContain('3.407 < 3.408');
        expect(question).not.toContain('At the thousandths place');
        const solution = render(less, true);
        expect(solution).toContain('3.407 < 3.408');
        expect(solution).toContain('At the thousandths place, 7 thousandths < 8 thousandths');
    });

    it('treats 2.3 and 2.300 as equal while preserving their distinct numeral strings', () => {
        expect(() => assertDecimalPlaceComparison('test', equal)).not.toThrow();
        const question = render(equal, false);
        expect(question).toContain('2.3');
        expect(question).toContain('2.300');
        expect(question).not.toContain('2.3 = 2.300');
        const solution = render(equal, true);
        expect(solution).toContain('2.3 = 2.300');
        expect(solution).toContain('Adding trailing zeros does not change the value');
    });

    it('uses the first differing hundredths digit after equal higher places for greater-than', () => {
        expect(() => assertDecimalPlaceComparison('test', greater)).not.toThrow();
        const solution = render(greater, true);
        expect(solution).toContain('At the hundredths place, 3 hundredths > 2 hundredths');
        expect(solution).toContain('4.83 > 4.82');
    });

    it('rejects an incorrect relation or a misplaced deciding witness', () => {
        expect(() => assertDecimalPlaceComparison('test', {
            ...less,
            witness: {...less.witness, decidingPlace: 'hundredths'}
        })).toThrow('first differing place');
        expect(() => assertDecimalPlaceComparison('test', {
            ...equal,
            right: {...equal.right, valueInThousandths: 2301}
        })).toThrow('exact, aligned');
    });

    it('shows actual zero thousandths as a count while withholding the deciding relation in Question', () => {
        const data = createDecimalPlaceComparison(
            {wholePart: 410, fractionalDigits: [6, 7, 8], displayPrecision: 3},
            {wholePart: 410, fractionalDigits: [6, 7, 0], displayPrecision: 2}
        )!;
        expect(data.witness).toMatchObject({kind: 'first-difference', decidingPlace: 'thousandths', leftDigit: 8, rightDigit: 0});
        const question = render(data, false);
        const solution = render(data, true);
        expect(question).toContain('Compare the counts of matching place-value units from left to right.');
        expect(question).toContain('8 thousandths');
        expect(question).toContain('0 thousandths');
        expect(question).toContain('Pale entries show zero units in an unwritten fractional place.');
        expect(question).not.toContain('410.678 > 410.67');
        expect(question).not.toContain('At the thousandths place');
        expect(renderMarkup(data, false)).not.toContain('bg-amber-100');
        expect(renderMarkup(data, false)).not.toContain('ring-emerald-400');
        expect(solution).toContain('8 thousandths > 0 thousandths');
        expect(solution).toContain('410.678 > 410.67');
    });

    it('does not introduce zero quantities into a complete nonzero place-unit comparison', () => {
        const data = createDecimalPlaceComparison(
            {wholePart: 876, fractionalDigits: [5, 4, 3], displayPrecision: 3},
            {wholePart: 876, fractionalDigits: [5, 4, 2], displayPrecision: 3}
        )!;
        for (const isSolution of [false, true]) {
            const rendered = render(data, isSolution);
            expect(rendered).not.toMatch(/\b0\b/);
            expect(rendered).not.toContain('zero units');
        }
        expect(render(data, true)).toContain('3 thousandths > 2 thousandths');
    });

    it.each(COMPARISON_PLACES)('names the canonical unit count at %s', place => {
        expect(comparisonPlaceUnit(place, 0)).toBe(place);
        expect(comparisonPlaceUnit(place, 1)).toBe(place.slice(0, -1));
        expect(comparisonPlaceUnit(place, 8)).toBe(place);
    });
});
