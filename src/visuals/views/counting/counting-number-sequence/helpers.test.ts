import {describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {
    MAX_PHYSICAL_SEQUENCE_LENGTH,
    resolveSequenceLayout
} from './helpers.ts';

describe('resolveSequenceLayout', () => {
    it('admits a full row of Arabic numerals through 1000', () => {
        const layout = resolveSequenceLayout(
            Scope.ArabicNumerals,
            [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
        );

        expect(layout.usesTiles).toBe(false);
        expect(layout.tileSizeClass).toContain('w-[56px]');
    });

    it('rejects Arabic numerals above the supported range', () => {
        expect(() => resolveSequenceLayout(Scope.ArabicNumerals, [1000, 1001]))
            .toThrow('through 1000');
    });

    it('admits compact physical sequences through 20', () => {
        const layout = resolveSequenceLayout(Scope.PhysicalNumbers, [15, 16, 17, 18, 19, 20]);

        expect(layout.usesTiles).toBe(true);
    });

    it('rejects physical values and rows beyond their visual capacity', () => {
        expect(() => resolveSequenceLayout(Scope.PhysicalNumbers, [20, 21]))
            .toThrow('through 20');
        expect(() => resolveSequenceLayout(
            Scope.PhysicalNumbers,
            Array.from({length: MAX_PHYSICAL_SEQUENCE_LENGTH + 1}, (_, index) => index + 1)
        )).toThrow('at most 6 cells');
    });

    it('rejects unsupported representations', () => {
        expect(() => resolveSequenceLayout(Scope.IntegerNumbers, [1, 2]))
            .toThrow('Unsupported number representation');
    });
});
