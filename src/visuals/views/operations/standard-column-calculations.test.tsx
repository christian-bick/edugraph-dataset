import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {multiplicationCase} from './operations-multiplication-standard-algorithm/fixtures.ts';
import {partialRowDigits} from './operations-multiplication-standard-algorithm/helpers.ts';
import {columnUnit, MultiplicationColumnCalculations, sumEquation} from './standard-column-calculations.tsx';

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const project = (a: number, b: number): string => {
    const data = multiplicationCase(a, b);
    return visible(renderToStaticMarkup(<MultiplicationColumnCalculations partialRows={data.partialRows}
        sumColumns={data.sumColumns} displayedRows={data.partialRows.map((_row, index) => partialRowDigits(data, index))}
        coefficient={false} />));
};

describe('canonical column arithmetic presentation', () => {
    it('names place units through the exact-decimal/safe-integer boundaries and rejects unsupported places', () => {
        expect([columnUnit(0), columnUnit(2), columnUnit(-2), columnUnit(15), columnUnit(-15)])
            .toEqual(['ones', 'hundreds', 'hundredths', 'quadrillions', 'quadrillionths']);
        expect(() => columnUnit(16)).toThrow('Unsupported column place');
        expect(() => columnUnit(-16)).toThrow('Unsupported column place');
    });

    it('retains genuine zero operands while omitting the initialized carry sentinel', () => {
        expect(sumEquation([2, 0], 0, 2)).toBe('2 + 0 = 2');
        expect(sumEquation([5, 5], 0, 10)).toBe('5 + 5 = 10');
        expect(sumEquation([8, 3], 1, 12)).toBe('8 + 3 + 1 = 12');
        expect(sumEquation([], 1, 1)).toBe('1 = 1');
    });

    it('shows shifted zero addends but excludes absent leading row positions', () => {
        const solution = project(88, 94);
        expect(solution).toContain('ones 2 + 0 = 2');
        expect(solution).toContain('thousands 7 + 1 = 8');
        expect(solution).not.toContain('0 + 7 + 1 = 8');
        expect(solution).not.toContain('8 × 4 + 0');
    });

    it('projects a carry-only final sum column without inventing padded operands', () => {
        // Neither partial row, 99 or 990, occupies the new thousands place.
        const solution = project(99, 11);
        expect(solution).toContain('thousands 1 = 1');
        expect(solution).not.toContain('0 + 0 + 1 = 1');
    });

    it('retains zero multiplier calculations and suppresses a redundant single-row sum', () => {
        const zeroRow = project(347, 206);
        expect(zeroRow).toContain('tens row: ×0, 1 place shifts');
        expect(zeroRow).toContain('ones 7 × 0 = 0');
        expect(zeroRow).toContain('tens 4 × 0 = 0');
        const zeroProduct = project(0, 2);
        expect(zeroProduct).toContain('ones 0 × 2 = 0');
        expect(zeroProduct).not.toContain('Add the aligned rows');
        expect(project(347, 2)).not.toContain('Add the aligned rows');
    });
});
