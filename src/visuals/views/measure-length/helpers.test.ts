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

    it('generates ticks correctly', () => {
        const ticks = getRulerTicks(2); // band length 2
        // Major ticks at 0, 1, 2. Minor ticks in between (9 per interval = 18 total).
        // Total ticks = 3 + 18 = 21.
        expect(ticks.length).toBe(21);
        expect(ticks[0].value).toBe(0);
        expect(ticks[10].value).toBe(1); // tick index 10 is major tick 1
        expect(ticks[20].value).toBe(2); // tick index 20 is major tick 2
    });
});
