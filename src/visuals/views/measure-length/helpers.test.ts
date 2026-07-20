import {describe, expect, it} from 'vitest';
import {formatMeasureAnswer, getRulerTicks} from './helpers.ts';

describe('measure-length helpers', () => {
    it('formats answer correctly', () => {
        const decimalResult = formatMeasureAnswer(5.4, true);
        expect(decimalResult.answer).toBe('5.4');
        expect(decimalResult.unit).toBe('cm');

        const integerResult = formatMeasureAnswer(5.4, false);
        expect(integerResult.answer).toBe('54');
        expect(integerResult.unit).toBe('mm');
    });

    it('generates ticks correctly for small band lengths', () => {
        const ticks = getRulerTicks(2, 20, 30); // band length 2, labelInterval = 1, minorTickCount = 9
        // Major ticks at 0, 1, 2. Minor ticks in between (9 per interval = 18 total).
        // Total ticks = 3 + 18 = 21.
        expect(ticks.length).toBe(21);
        expect(ticks[0].value).toBe(0);
        expect(ticks[10].value).toBe(1); 
        expect(ticks[20].value).toBe(2);
    });

    it('generates ticks correctly for medium band lengths (e.g. 15)', () => {
        const ticks = getRulerTicks(15, 20, 20); // band length 15, labelInterval = 1, minorTickCount = 1
        // Major ticks at 0..15 (16 total). Minor ticks at every half-unit (15 total).
        // Total = 31 ticks.
        expect(ticks.length).toBe(31);
        expect(ticks[0].value).toBe(0);
        expect(ticks[1].y2).toBe(12); // minor tick
        expect(ticks[2].value).toBe(1); // major tick
    });

    it('generates ticks correctly for large band lengths (e.g. 100)', () => {
        const ticks = getRulerTicks(100, 20, 7); // band length 100, labelInterval = 10, minorTickCount = 0
        // Major ticks at 0..100 (101 total). No minor ticks.
        expect(ticks.length).toBe(101);
        expect(ticks[0].value).toBe(0);
        expect(ticks[1].value).toBeUndefined(); // tick 1 has no label
        expect(ticks[10].value).toBe(10); // tick 10 is labeled
    });
});
