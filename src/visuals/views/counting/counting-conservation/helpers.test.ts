import {describe, expect, it} from 'vitest';
import {CONSERVATION_ROW_WIDTH, getConservationLayout} from './helpers.ts';

describe('counting-conservation helpers', () => {
    it.each(Array.from({length: 20}, (_, index) => index + 1))(
        'keeps both arrangements contained for %i objects',
        (number) => {
            const layout = getConservationLayout(number);
            const closeWidth = number * layout.iconSize + (number - 1) * layout.closeGap;
            const farWidth = number * layout.iconSize + (number - 1) * layout.farGap;

            expect(closeWidth).toBeLessThanOrEqual(CONSERVATION_ROW_WIDTH);
            expect(farWidth).toBeLessThanOrEqual(CONSERVATION_ROW_WIDTH);
            expect(layout.farGap).toBeGreaterThanOrEqual(layout.closeGap);
        }
    );

    it('uses visibly wider spacing for arrangements with multiple objects', () => {
        for (let number = 2; number <= 20; number += 1) {
            const layout = getConservationLayout(number);
            expect(layout.farGap).toBeGreaterThan(layout.closeGap);
        }
    });

    it.each([0, 21, 2.5])('rejects unsupported object count %s', (number) => {
        expect(() => getConservationLayout(number))
            .toThrow(/numObjects must be an integer between 1 and 20/);
    });
});
