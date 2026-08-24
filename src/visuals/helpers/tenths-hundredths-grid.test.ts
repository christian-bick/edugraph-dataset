import {describe, expect, it} from 'vitest';
import {
    isValidTenthsHundredthsGrid,
    toTenthsHundredthsGrid
} from './tenths-hundredths-grid.ts';

describe('tenths-hundredths grid projection', () => {
    it.each([
        [{numerator: 3, denominator: 10} as const, 1, 100],
        [{numerator: 30, denominator: 100} as const, 10, 10]
    ])('derives a valid deterministic grid for %o', (value, rows, heightPercent) => {
        const model = toTenthsHundredthsGrid(value);

        expect(model).toMatchObject({
            display: `${value.numerator}/${value.denominator}`,
            rows,
            columns: 10,
            partCount: value.denominator,
            shadedCount: value.numerator,
            groups: []
        });
        expect(model.cells).toHaveLength(value.denominator);
        expect(model.cells.filter(cell => cell.shaded)).toHaveLength(value.numerator);
        expect(model.cells.every(cell => cell.heightPercent === heightPercent)).toBe(true);
        expect(isValidTenthsHundredthsGrid(model, value)).toBe(true);
    });

    it('projects source groups without changing the rational value', () => {
        const value = {numerator: 30, denominator: 100} as const;
        const groups = [{
            source: 'first-addend' as const,
            label: '3/10',
            startCell: 0,
            cellCount: 30
        }];
        const model = toTenthsHundredthsGrid(value, groups);

        expect(model.cells.slice(0, 30).every(cell => cell.source === 'first-addend')).toBe(true);
        expect(model.cells.slice(30).every(cell => cell.source === null)).toBe(true);
        expect(isValidTenthsHundredthsGrid(model, value, groups)).toBe(true);
    });
});
