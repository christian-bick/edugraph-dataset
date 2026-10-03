import {describe, expect, it} from 'vitest';
import {
    buildFractionLinePlotPresentation,
    formatCupAmount,
    formatFractionValue,
    fractionStep,
    isValidMeasurementLinePlotFractionProblem,
    plotTicks
} from './helpers.ts';
import {cases, fixtureFor} from './fixtures.ts';

describe('fractional beaker line plot contract', () => {
    it.each(cases)('validates exact $operation on the 1/$denominator lattice', ({denominator, operation}) => {
        const data = fixtureFor(denominator, operation);
        const presentation = buildFractionLinePlotPresentation(data);
        const ticks = plotTicks(data);
        expect(isValidMeasurementLinePlotFractionProblem(data)).toBe(true);
        expect(ticks).toHaveLength(2 * denominator + 1);
        expect(ticks.reduce((sum, tick) => sum + tick.count, 0)).toBe(5);
        expect(ticks[0]?.label).toBe('1');
        expect(ticks.at(-1)?.label).toBe('3');
        expect(fractionStep(denominator)).toBe(denominator === 2 ? '½' : denominator === 4 ? '¼' : '⅛');
        expect(presentation.equations.at(-1)).toContain(presentation.answer);
        expect(presentation.story).not.toMatch(/\d[⅛¼⅜½⅝¾⅞]/);
    });

    it('formats proper and mixed fractions with exact cup grammar', () => {
        expect(formatFractionValue(1, 2)).toBe('½');
        expect(formatFractionValue(11, 8)).toBe('1⅜');
        expect(formatCupAmount(8, 8)).toBe('1 cup');
        expect(formatCupAmount(13, 8)).toBe('1⅝ cups');
    });

    it('rejects off-grid, out-of-range, wrong-length, and denominator-free observations', () => {
        const data = fixtureFor(4, 'addition');
        for (const invalid of [
            {...data, denominator: 3},
            {...data, observationNumerators: [4, 5, 6, 6]},
            {...data, observationNumerators: [4, 5.5, 6, 6, 8]},
            {...data, observationNumerators: [4, 5, 6, 6, 13]},
            {...data, observationNumerators: [4, 6, 6, 6, 8]}
        ]) expect(isValidMeasurementLinePlotFractionProblem(invalid as never)).toBe(false);
    });

    it('rejects inconsistent ranked operands, tied modes, and false redistribution', () => {
        const add = fixtureFor(8, 'addition');
        const sub = fixtureFor(8, 'subtraction');
        const multiply = fixtureFor(8, 'multiplication');
        const divide = fixtureFor(8, 'division');
        expect(isValidMeasurementLinePlotFractionProblem({
            ...add, relation: {operation: 'addition', operandNumerators: [8, 10], resultNumerator: 18}
        })).toBe(false);
        expect(isValidMeasurementLinePlotFractionProblem({
            ...sub, relation: {operation: 'subtraction', minuendNumerator: 11, subtrahendNumerator: 9, resultNumerator: 2}
        })).toBe(false);
        expect(isValidMeasurementLinePlotFractionProblem({
            ...multiply, relation: {operation: 'multiplication', operandNumerator: 9, frequency: 2, resultNumerator: 18}
        })).toBe(false);
        expect(isValidMeasurementLinePlotFractionProblem({
            ...divide, relation: {operation: 'division', totalNumerator: 44, recipientCount: 5, shareNumerator: 9}
        })).toBe(false);
        expect(isValidMeasurementLinePlotFractionProblem({
            ...divide, relation: {operation: 'division', totalNumerator: 45, recipientCount: 5, shareNumerator: 8}
        })).toBe(false);
    });
});
