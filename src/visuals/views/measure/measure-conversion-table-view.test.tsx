import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {MeasurementConversionPair, StandardUnitEquivalencesProblem} from '../../../types/problems.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {formatStandardNumeral} from '../../../lib/whole-number-notation.ts';
import {getMeasurementUnitPresentation} from '../../helpers/measurement-conversion.ts';
import {MeasureConversionTableCore} from './measure-conversion-table-view.tsx';

const pairs = [
    {id: 'kilometer-meter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'kilometer', smallerUnit: 'meter', factor: 1000},
    {id: 'meter-centimeter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'meter', smallerUnit: 'centimeter', factor: 100},
    {id: 'kilogram-gram', quantityKind: 'weight', scalingKind: 'magnitude', largerUnit: 'kilogram', smallerUnit: 'gram', factor: 1000},
    {id: 'pound-ounce', quantityKind: 'weight', scalingKind: 'factor', largerUnit: 'pound', smallerUnit: 'ounce', factor: 16},
    {id: 'liter-milliliter', quantityKind: 'liquid-volume', scalingKind: 'magnitude', largerUnit: 'liter', smallerUnit: 'milliliter', factor: 1000},
    {id: 'hour-minute', quantityKind: 'time', scalingKind: 'factor', largerUnit: 'hour', smallerUnit: 'minute', factor: 60},
    {id: 'minute-second', quantityKind: 'time', scalingKind: 'factor', largerUnit: 'minute', smallerUnit: 'second', factor: 60}
] as const satisfies readonly MeasurementConversionPair[];

const sequence = (pair: MeasurementConversionPair, start: number): StandardUnitEquivalencesProblem => ({
    pair, equivalents: Array.from({length: 5}, (_, index) => ({
        largerValue: start + index, smallerValue: (start + index) * pair.factor
    }))
});

function render(data: StandardUnitEquivalencesProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'measure-conversion-table'> = {
        problem: {type: 'measurement', data, labels: []}, viewId: 'measure-conversion-table',
        targetLabels: [], isSolutionView, seed: 19
    };
    return renderToStaticMarkup(<MeasureConversionTableCore payload={payload} />);
}

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('measurement conversion table projection', () => {
    it.each(pairs)('preserves the five-row table and two withheld answers for $id', pair => {
        for (const start of [2, 9]) {
            const data = sequence(pair, start);
            const smaller = getMeasurementUnitPresentation(pair.smallerUnit);
            const question = visible(render(data, false));
            const solution = visible(render(data, true));
            expect(question).toContain('Record equivalent measurements');
            expect(question.split(`Write ${smaller.symbol}`)).toHaveLength(3);
            expect(solution).not.toContain(`Write ${smaller.symbol}`);
            expect(question).toContain(`Complete the 2 blank entries in the ${smaller.plural} column.`);
            data.equivalents.forEach((row, index) => {
                const value = formatStandardNumeral(row.smallerValue);
                if (index < 3) expect(question).toContain(value);
                else expect(question).not.toContain(value);
                expect(solution).toContain(value);
            });
            expect(solution).toContain('For example,');
            expect(render(data, false)).toBe(render(data, false));
        }
    });

    it('keeps the sequence upper boundary beyond the numeric-example display bound', () => {
        const solution = visible(render(sequence(pairs[0], 9), true));
        expect(solution).toContain('13 kilometers = 13,000 meters');
    });

    it('rejects missing rows, incoherent factors and invalid quantities before rendering', () => {
        const valid = sequence(pairs[0], 2);
        for (const invalid of [
            {...valid, equivalents: valid.equivalents.slice(1)},
            {...valid, pair: {...valid.pair, factor: 100 as const}},
            {...valid, equivalents: [{largerValue: 2, smallerValue: 2001}, ...valid.equivalents.slice(1)]}
        ]) expect(() => render(invalid, false)).toThrow('five coherent equivalent measurements');
        expect(() => render({...valid, equivalents: undefined as never}, false)).toThrow();
    });
});
