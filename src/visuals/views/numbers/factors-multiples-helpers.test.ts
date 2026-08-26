import {describe, expect, it} from 'vitest';
import {formatDivisionRemainder} from './factors-multiples-helpers.ts';

describe('formatDivisionRemainder', () => {
    it('describes exact division without introducing zero into the artifact', () => {
        expect(formatDivisionRemainder(0)).toBe('Divides evenly');
        expect(formatDivisionRemainder(0)).not.toContain('0');
    });

    it('reports a nonzero remainder when one exists', () => {
        expect(formatDivisionRemainder(3)).toBe('Remainder: 3');
    });
});
