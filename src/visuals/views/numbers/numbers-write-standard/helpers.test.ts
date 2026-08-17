import {describe, expect, it} from 'vitest';
import {legacyNumeralDigits, legacyWritingCue, placeValueResponseDigits} from './helpers.ts';

describe('numbers-write-standard response digits', () => {
    it('splits a legacy numeral into one digit per response box', () => {
        expect(legacyNumeralDigits(901)).toEqual(['9', '0', '1']);
        expect(legacyNumeralDigits(7)).toEqual(['7']);
    });

    it('uses the supplied Grade 4 place digits and preserves zero', () => {
        expect(placeValueResponseDigits([
            {name: 'thousands', exponent: 3, digit: 4, value: 4000},
            {name: 'hundreds', exponent: 2, digit: 0, value: 0},
            {name: 'tens', exponent: 1, digit: 2, value: 20},
            {name: 'ones', exponent: 0, digit: 5, value: 5}
        ])).toEqual(['4', '0', '2', '5']);
    });

    it('withholds the Grade 2 numeral while identifying the block-writing task', () => {
        expect(legacyWritingCue(952, false)).toEqual({
            instruction: 'Write the numeral represented by the base-ten blocks.',
            sourceText: null
        });
        expect(legacyWritingCue(952, true).sourceText).toBe('952');
    });

    it('keeps the empty-model cue in both modes without using it as the answer symbol', () => {
        expect(legacyWritingCue(0, false)).toEqual({
            instruction: 'Write the numeral.',
            sourceText: 'No objects'
        });
        expect(legacyWritingCue(0, true)).toEqual({
            instruction: 'Write the numeral.',
            sourceText: 'No objects'
        });
    });
});
