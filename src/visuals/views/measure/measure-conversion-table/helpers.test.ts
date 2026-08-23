import {describe, expect, it} from 'vitest';
import {MeasurementConversionGenerator} from '../../../../generators/measurement/measurement-conversion/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {MeasurementConversionTableProblem} from '../../../../types/problems.ts';
import {formatTableValue, hasCoherentConversionTable} from './helpers.ts';

const buildTable = (seed: string): MeasurementConversionTableProblem => {
    setSeed(seed);
    const data = new MeasurementConversionGenerator().generate({
        task: 'conversion-table',
        unitPair: 'kilometer-meter'
    }).data;
    if (data.task !== 'conversion-table') {
        throw new Error(`Expected table, received ${data.task}.`);
    }
    return data;
};

describe('hasCoherentConversionTable', () => {
    it('accepts canonical rows across the complete start range', () => {
        const starts = new Set<number>();
        for (let seed = 0; seed < 100; seed++) {
            const data = buildTable(`table-${seed}`);
            starts.add(data.rows[0]!.largerValue);
            expect(hasCoherentConversionTable(data)).toBe(true);
        }
        expect(starts).toEqual(new Set([1, 2, 3, 4, 5]));
    });

    it('rejects inconsistent pairs, rows, and ranges', () => {
        const valid = buildTable('valid');
        expect(hasCoherentConversionTable({
            ...valid,
            pair: {...valid.pair, factor: 100}
        })).toBe(false);
        expect(hasCoherentConversionTable({
            ...valid,
            rows: valid.rows.map((row, index) => index === 1
                ? {...row, smallerValue: row.smallerValue + 1}
                : row)
        })).toBe(false);
        expect(hasCoherentConversionTable({...valid, rows: valid.rows.slice(0, 4)})).toBe(false);
        expect(hasCoherentConversionTable({
            ...valid,
            rows: valid.rows.map(row => ({
                ...row,
                largerValue: row.largerValue + 5,
                smallerValue: (row.largerValue + 5) * valid.pair.factor
            }))
        })).toBe(false);
    });
});

describe('formatTableValue', () => {
    it('groups large table values deterministically', () => {
        expect(formatTableValue(12000)).toBe('12,000');
    });
});
