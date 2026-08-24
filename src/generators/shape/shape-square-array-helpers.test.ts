import {describe, expect, it} from 'vitest';
import {selectArrayDimensions} from './shape-square-array-helpers.ts';

describe('shape square-array generator helpers', () => {
    it('selects every supported non-square dimension pair', () => {
        const selected = new Set(Array.from({length: 12}, (_, index) =>
            selectArrayDimensions((index + 0.5) / 12).join('x')
        ));

        expect(selected).toHaveLength(12);
        for (const dimensions of selected) {
            const [rows, columns] = dimensions.split('x').map(Number);
            expect(rows).toBeGreaterThanOrEqual(2);
            expect(columns).toBeLessThanOrEqual(5);
            expect(rows).not.toBe(columns);
            expect(rows! * columns!).toBeLessThanOrEqual(20);
        }
    });

    it('bounds invalid selector values deterministically', () => {
        expect(selectArrayDimensions(-1)).toEqual([2, 3]);
        expect(selectArrayDimensions(Number.NaN)).toEqual([2, 3]);
        expect(selectArrayDimensions(2)).toEqual([5, 4]);
    });
});
