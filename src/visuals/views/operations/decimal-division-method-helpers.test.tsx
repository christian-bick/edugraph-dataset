import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {DecimalDivisionProblem} from '../../../types/problems.ts';
import {assertDecimalDivision} from './decimal-division-method-helpers.ts';

const fullAndPartial: DecimalDivisionProblem = {
    kind: 'decimal-division-model', base: 10, operandScale: 100, quotientScale: 10000,
    dividend: {valueInHundredths: 17, canonicalNumeral: '0.17', alignedDigits: [0, 1, 7]},
    divisor: {valueInHundredths: 16, canonicalNumeral: '0.16', alignedDigits: [0, 1, 6]},
    quotient: {valueInTenThousandths: 10625, canonicalNumeral: '1.0625', precision: 4, alignedDigits: [1, 0, 6, 2, 5]},
    grouping: {
        unitValueInHundredths: 1, cellsPerGroup: 16, fullGroupCount: 1, remainderCells: 1,
        bars: [
            {kind: 'full', index: 0, capacityCells: 16, filledCells: 16, quotientContributionInTenThousandths: 10000},
            {kind: 'partial', index: 1, capacityCells: 16, filledCells: 1, quotientContributionInTenThousandths: 625}
        ]
    },
    divisionTrace: {
        dividendUnitCount: 17, divisorUnitCount: 16,
        steps: [
            {place: 'ones', partialDividend: 17, quotientDigit: 1, subtrahend: 16, remainder: 1},
            {place: 'tenths', partialDividend: 10, quotientDigit: 0, subtrahend: 0, remainder: 10},
            {place: 'hundredths', partialDividend: 100, quotientDigit: 6, subtrahend: 96, remainder: 4},
            {place: 'thousandths', partialDividend: 40, quotientDigit: 2, subtrahend: 32, remainder: 8},
            {place: 'ten-thousandths', partialDividend: 80, quotientDigit: 5, subtrahend: 80, remainder: 0}
        ]
    },
    inverse: {divisorTimesQuotientInMillionths: 170000, dividendInMillionths: 170000}
};

const onlyPartial: DecimalDivisionProblem = {
    ...fullAndPartial,
    dividend: {valueInHundredths: 1, canonicalNumeral: '0.01', alignedDigits: [0, 0, 1]},
    quotient: {valueInTenThousandths: 625, canonicalNumeral: '0.0625', precision: 4, alignedDigits: [0, 0, 6, 2, 5]},
    grouping: {
        unitValueInHundredths: 1, cellsPerGroup: 16, fullGroupCount: 0, remainderCells: 1,
        bars: [{kind: 'partial', index: 0, capacityCells: 16, filledCells: 1, quotientContributionInTenThousandths: 625}]
    },
    divisionTrace: {
        dividendUnitCount: 1, divisorUnitCount: 16,
        steps: [
            {place: 'ones', partialDividend: 1, quotientDigit: 0, subtrahend: 0, remainder: 1},
            {place: 'tenths', partialDividend: 10, quotientDigit: 0, subtrahend: 0, remainder: 10},
            {place: 'hundredths', partialDividend: 100, quotientDigit: 6, subtrahend: 96, remainder: 4},
            {place: 'thousandths', partialDividend: 40, quotientDigit: 2, subtrahend: 32, remainder: 8},
            {place: 'ten-thousandths', partialDividend: 80, quotientDigit: 5, subtrahend: 80, remainder: 0}
        ]
    },
    inverse: {divisorTimesQuotientInMillionths: 10000, dividendInMillionths: 10000}
};

const integerQuotient: DecimalDivisionProblem = {
    ...fullAndPartial,
    dividend: {valueInHundredths: 48, canonicalNumeral: '0.48', alignedDigits: [0, 4, 8]},
    quotient: {valueInTenThousandths: 30000, canonicalNumeral: '3', precision: 0, alignedDigits: [3, 0, 0, 0, 0]},
    grouping: {
        unitValueInHundredths: 1, cellsPerGroup: 16, fullGroupCount: 3, remainderCells: 0,
        bars: [0, 1, 2].map(index => ({
            kind: 'full' as const, index, capacityCells: 16, filledCells: 16, quotientContributionInTenThousandths: 10000
        }))
    },
    divisionTrace: {
        dividendUnitCount: 48, divisorUnitCount: 16,
        steps: [{place: 'ones', partialDividend: 48, quotientDigit: 3, subtrahend: 48, remainder: 0}]
    },
    inverse: {divisorTimesQuotientInMillionths: 480000, dividendInMillionths: 480000}
};

const maximumModel: DecimalDivisionProblem = {
    ...fullAndPartial,
    dividend: {valueInHundredths: 79, canonicalNumeral: '0.79', alignedDigits: [0, 7, 9]},
    quotient: {valueInTenThousandths: 49375, canonicalNumeral: '4.9375', precision: 4, alignedDigits: [4, 9, 3, 7, 5]},
    grouping: {
        unitValueInHundredths: 1, cellsPerGroup: 16, fullGroupCount: 4, remainderCells: 15,
        bars: [
            ...[0, 1, 2, 3].map(index => ({kind: 'full' as const, index, capacityCells: 16, filledCells: 16, quotientContributionInTenThousandths: 10000})),
            {kind: 'partial', index: 4, capacityCells: 16, filledCells: 15, quotientContributionInTenThousandths: 9375}
        ]
    },
    divisionTrace: {
        dividendUnitCount: 79, divisorUnitCount: 16,
        steps: [
            {place: 'ones', partialDividend: 79, quotientDigit: 4, subtrahend: 64, remainder: 15},
            {place: 'tenths', partialDividend: 150, quotientDigit: 9, subtrahend: 144, remainder: 6},
            {place: 'hundredths', partialDividend: 60, quotientDigit: 3, subtrahend: 48, remainder: 12},
            {place: 'thousandths', partialDividend: 120, quotientDigit: 7, subtrahend: 112, remainder: 8},
            {place: 'ten-thousandths', partialDividend: 80, quotientDigit: 5, subtrahend: 80, remainder: 0}
        ]
    },
    inverse: {divisorTimesQuotientInMillionths: 790000, dividendInMillionths: 790000}
};

let Core: typeof import('./operations-decimal-division-method/view.tsx').OperationsDecimalDivisionMethodCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Core = (await import('./operations-decimal-division-method/view.tsx')).OperationsDecimalDivisionMethodCore;
});
afterAll(() => vi.unstubAllGlobals());

function render(data: DecimalDivisionProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'operations-decimal-division-method'> = {
        problem: {type: 'arithmetic', data, labels: []},
        viewId: 'operations-decimal-division-method', targetLabels: [], isSolutionView, seed: 4
    };
    return renderToStaticMarkup(<Core payload={payload} />);
}

function visible(markup: string): string {
    return markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

describe('decimal division grouping and trace view', () => {
    it('shows given countable cells but withholds grouping, quotient and inverse in Question Mode', () => {
        expect(() => assertDecimalDivision('test', fullAndPartial)).not.toThrow();
        const question = render(fullAndPartial, false);
        const text = visible(question);
        expect(text).toContain('0.17 ÷ 0.16');
        expect(text).not.toContain('1.0625');
        expect(text).not.toContain('Full group 1');
        expect(text).not.toContain('0.16 ×');
        expect(question).toContain('16 filled of 16 hundredth-unit cells');
        expect(question).toContain('Draw full divisor-sized groups');
    });

    it('renders a full group, partial bar, exact 1.0625 trace with zero tenths and inverse', () => {
        const solution = render(fullAndPartial, true);
        const text = visible(solution);
        expect(text).toContain('0.17 ÷ 0.16 = 1.0625');
        expect(text).toContain('Full group 1');
        expect(text).toContain('Partial group');
        expect(solution).toContain('1 filled of 16 hundredth-unit cells');
        expect(text).toContain('tenths 10 0 16 × 0 = 0 10');
        expect(text).toContain('0.16 × 1.0625 = 0.17');
        expect(text).toContain('1/16 partial group gives the fractional quotient');
        expect(text).toContain('multiply the remainder by 10');
    });

    it('retains both leading zero quotient digits for 0.01 divided by 0.16', () => {
        expect(() => assertDecimalDivision('test', onlyPartial)).not.toThrow();
        const text = visible(render(onlyPartial, true));
        expect(text).toContain('0.01 ÷ 0.16 = 0.0625');
        expect(text).toContain('ones 1 0 16 × 0 = 0 1');
        expect(text).toContain('tenths 10 0 16 × 0 = 0 10');
        expect(text).not.toContain('Full group 1');
    });

    it('supports an integer quotient and stays bounded at four full bars plus a partial bar', () => {
        expect(() => assertDecimalDivision('test', integerQuotient)).not.toThrow();
        const integerQuestion = visible(render(integerQuotient, false));
        expect(integerQuestion).toContain('ten-thousandths');
        expect(integerQuestion).not.toContain('0.48 ÷ 0.16 = 3');
        expect(visible(render(integerQuotient, true))).toContain('0.48 ÷ 0.16 = 3');
        expect(() => assertDecimalDivision('test', maximumModel)).not.toThrow();
        const max = render(maximumModel, true);
        expect((max.match(/Full group [1-4]/g) ?? []).length).toBe(4);
        expect(max).toContain('15 filled of 16 hundredth-unit cells');
        expect(visible(max)).toContain('4.9375');
    });

    it('rejects an incorrect partial fill or missing zero trace step', () => {
        expect(() => assertDecimalDivision('test', {
            ...fullAndPartial,
            grouping: {
                ...fullAndPartial.grouping,
                bars: [fullAndPartial.grouping.bars[0], {...fullAndPartial.grouping.bars[1], filledCells: 2}]
            }
        })).toThrow('exact filled cells');
        expect(() => assertDecimalDivision('test', {
            ...fullAndPartial,
            divisionTrace: {
                ...fullAndPartial.divisionTrace,
                steps: [fullAndPartial.divisionTrace.steps[0], ...fullAndPartial.divisionTrace.steps.slice(2)]
            }
        })).toThrow('required place');
    });
});
