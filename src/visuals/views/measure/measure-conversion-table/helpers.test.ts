import {describe, expect, it} from 'vitest';
import {MeasurementConversionGenerator} from '../../../../generators/measurement/measurement-conversion/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {StandardUnitEquivalencesProblem} from '../../../../types/problems.ts';
import {formatTableValue, hasCoherentConversionTable} from './helpers.ts';

const buildEquivalences = (seed: string): StandardUnitEquivalencesProblem => {
    setSeed(seed);
    const data = new MeasurementConversionGenerator().generate({unitPair: 'kilometer-meter'}).data;
    return data;
};

describe('hasCoherentConversionTable', () => {
    it('accepts canonical equivalences across the complete starting range', () => {
        const starts = new Set<number>();
        for (let seed = 0; seed < 100; seed++) {
            const data = buildEquivalences(`table-${seed}`);
            starts.add(data.equivalents[0]!.largerValue);
            expect(hasCoherentConversionTable(data)).toBe(true);
        }
        expect(starts).toEqual(new Set([2, 3, 4, 5, 6, 7, 8, 9]));
    });

    it('rejects inconsistent unit pairs and equivalent quantities', () => {
        const valid = buildEquivalences('valid');
        expect(hasCoherentConversionTable({...valid, pair: {...valid.pair, factor: 100}})).toBe(false);
        expect(hasCoherentConversionTable({...valid, equivalents: valid.equivalents.slice(0, 4)})).toBe(false);
        expect(hasCoherentConversionTable({...valid, equivalents: undefined as never})).toBe(false);
        expect(hasCoherentConversionTable(null as never)).toBe(false);
        for (const replacement of [
            {largerValue: 0, smallerValue: 0},
            {largerValue: 1.5, smallerValue: 1500},
            {largerValue: 2, smallerValue: 1999},
            {largerValue: 2, smallerValue: 2000.5},
            null
        ]) {
            const equivalents = [...valid.equivalents];
            equivalents[1] = replacement as never;
            expect(hasCoherentConversionTable({...valid, equivalents})).toBe(false);
        }
        for (const start of [1, 10]) {
            const equivalents = Array.from({length: 5}, (_, index) => ({
                largerValue: start + index,
                smallerValue: (start + index) * valid.pair.factor
            }));
            expect(hasCoherentConversionTable({...valid, equivalents})).toBe(false);
        }
    });
});

describe('formatTableValue', () => {
    it('groups large values deterministically', () => {
        expect(formatTableValue(12000)).toBe('12,000');
    });
});
