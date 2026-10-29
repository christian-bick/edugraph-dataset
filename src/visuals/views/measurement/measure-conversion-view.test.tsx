import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {GenericUnitScaleRelationProblem, MeasurementConversionPair,
    MeasurementConversionValuesProblem, UnitEquivalenceSequenceProblem} from '../../../types/problems.ts';
import {getMeasurementUnitPresentation, formatUnitEquivalence} from '../../helpers/measurement-conversion.ts';
import {formatConversionHundredths} from './measure-conversion-helpers.ts';
import {MeasureConversionToSmallerView, MeasureConversionBidirectionalView,
    MeasureConversionDerivationView} from './measure-conversion-view.tsx';

const pairs = [
    {id: 'kilometer-meter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'kilometer', smallerUnit: 'meter', factor: 1000},
    {id: 'meter-centimeter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'meter', smallerUnit: 'centimeter', factor: 100},
    {id: 'kilogram-gram', quantityKind: 'weight', scalingKind: 'magnitude', largerUnit: 'kilogram', smallerUnit: 'gram', factor: 1000},
    {id: 'pound-ounce', quantityKind: 'weight', scalingKind: 'factor', largerUnit: 'pound', smallerUnit: 'ounce', factor: 16},
    {id: 'liter-milliliter', quantityKind: 'liquid-volume', scalingKind: 'magnitude', largerUnit: 'liter', smallerUnit: 'milliliter', factor: 1000},
    {id: 'hour-minute', quantityKind: 'time', scalingKind: 'factor', largerUnit: 'hour', smallerUnit: 'minute', factor: 60},
    {id: 'minute-second', quantityKind: 'time', scalingKind: 'factor', largerUnit: 'minute', smallerUnit: 'second', factor: 60}
] as const satisfies readonly MeasurementConversionPair[];

const sequence = (pair: MeasurementConversionPair, start = 2): UnitEquivalenceSequenceProblem => ({
    pair, equivalents: Array.from({length: 5}, (_, index) => ({
        largerValue: start + index, smallerValue: (start + index) * pair.factor
    }))
});

function values(pair: MeasurementConversionPair, numberKind: 'integer' | 'decimal'): MeasurementConversionValuesProblem {
    const quantities = numberKind === 'decimal' ? [125, 225] : [200, 300];
    return {pair, numericExamples: {numberKind, equalities: [
        {largerHundredths: quantities[0]!, smallerHundredths: quantities[0]! * pair.factor},
        {largerHundredths: quantities[1]!, smallerHundredths: quantities[1]! * pair.factor}
    ]}};
}

function renderSequence(data: UnitEquivalenceSequenceProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'measure-conversion-to-smaller'> = {
        problem: {type: 'measurement', data, labels: []}, viewId: 'measure-conversion-to-smaller',
        targetLabels: [], isSolutionView, seed: 17
    };
    return renderToStaticMarkup(<MeasureConversionToSmallerView payload={payload} />);
}

function renderValues(data: MeasurementConversionValuesProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'measure-conversion-bidirectional'> = {
        problem: {type: 'measurement', data, labels: []}, viewId: 'measure-conversion-bidirectional',
        targetLabels: [], isSolutionView, seed: 17
    };
    return renderToStaticMarkup(<MeasureConversionBidirectionalView payload={payload} />);
}

function renderDerivation(data: GenericUnitScaleRelationProblem | UnitEquivalenceSequenceProblem,
    isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'measure-conversion-derivation'> = {
        problem: {type: 'measurement', data, labels: []}, viewId: 'measure-conversion-derivation',
        targetLabels: [], isSolutionView, seed: 17
    };
    return renderToStaticMarkup(<MeasureConversionDerivationView payload={payload} />);
}

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('fixed measurement conversion tasks', () => {
    it.each(pairs)('keeps the one-way task and withholds its answer for $id', pair => {
        for (const start of [2, 9]) {
            const data = sequence(pair, start);
            const question = visible(renderSequence(data, false));
            const solution = visible(renderSequence(data, true));
            const factor = formatConversionHundredths(pair.factor * 100);
            const result = formatConversionHundredths(start * pair.factor * 100);
            expect(question).toContain('Convert to a smaller unit');
            expect(question).toContain(`${start} × ${factor} = ?`);
            expect(question).not.toContain(`${start} × ${factor} = ${result}`);
            expect(question).not.toContain('Convert in both directions');
            expect(solution).toContain(`${start} × ${factor} = ${result}`);
            expect(renderSequence(data, false)).toBe(renderSequence(data, false));
        }
    });

    it.each(pairs)('retains standard-unit derivation evidence for $id', pair => {
        const data = sequence(pair);
        const question = visible(renderDerivation(data, false));
        const solution = visible(renderDerivation(data, true));
        expect(question).toContain('Derive a unit-size relation');
        expect(question).toContain('Common-quantity evidence');
        expect(question).toContain(`1 ${getMeasurementUnitPresentation(pair.largerUnit).singular} = ?`);
        expect(question).not.toContain(formatUnitEquivalence(pair));
        expect(solution).toContain(formatUnitEquivalence(pair));
        expect(solution).toContain('Dividing both counts by 2');
        expect(question).not.toContain('Convert in both directions');
    });

    it.each(pairs)('retains both decimal conversion directions for $id', pair => {
        const data = values(pair, 'decimal');
        const question = visible(renderValues(data, false));
        const solution = visible(renderValues(data, true));
        const larger = getMeasurementUnitPresentation(pair.largerUnit);
        const smaller = getMeasurementUnitPresentation(pair.smallerUnit);
        const firstResult = formatConversionHundredths(125 * pair.factor);
        const secondSource = formatConversionHundredths(225 * pair.factor);
        const factor = formatConversionHundredths(pair.factor * 100);
        expect(question).toContain('Convert in both directions');
        expect(question).toContain(`1.25 ${larger.symbol}`);
        expect(question).toContain(`${secondSource} ${smaller.symbol}`);
        expect(question).toContain(`1.25 × ${factor} = ?`);
        expect(question).not.toContain(`${firstResult} ${smaller.symbol}`);
        expect(question).not.toContain(`2.25 ${larger.symbol}`);
        expect(solution).toContain(`1.25 × ${factor} = ${firstResult}`);
        expect(solution).toContain(`${secondSource} ÷ ${factor} = 2.25`);
        expect(solution).toContain('Multiply by');
        expect(solution).toContain('divide by');
        expect(renderValues(data, true)).toBe(renderValues(data, true));
    });

    it.each(pairs)('keeps integer values integral in both directions for $id', pair => {
        const data = values(pair, 'integer');
        const solution = visible(renderValues(data, true));
        const factor = formatConversionHundredths(pair.factor * 100);
        expect(solution).toContain(`2 × ${factor} = ${formatConversionHundredths(200 * pair.factor)}`);
        expect(solution).toContain(`${formatConversionHundredths(300 * pair.factor)} ÷ ${factor} = 3`);
        expect(solution).not.toContain('2.00');
    });

    it('preserves generic equal-length derivation for all eight scale configurations', () => {
        for (const largeUnitCount of [3, 4, 5, 6]) {
            for (const unitsPerLarge of [2, 3]) {
                const data = {largeUnitCount, unitsPerLarge, smallUnitCount: largeUnitCount * unitsPerLarge};
                const question = visible(renderDerivation(data, false));
                const solution = visible(renderDerivation(data, true));
                expect(question).toContain('Which unit size needs more units?');
                expect(question).toContain('Conclusion: ______ units need a larger count.');
                expect(question).not.toContain('Smaller units need a larger count:');
                expect(solution).toContain(`Smaller units need a larger count: ${data.smallUnitCount} &gt; ${largeUnitCount}.`);
                expect(solution).toContain(`${largeUnitCount} × ${unitsPerLarge} = ${data.smallUnitCount}`);
            }
        }
    });

    it('requires the fixed leaf payload instead of dispatching on optional examples', () => {
        const rows = sequence(pairs[0]);
        const numeric = values(pairs[0], 'decimal');
        expect(() => renderSequence(numeric as never, false)).toThrow('equivalents');
        expect(() => renderValues(rows as never, false)).toThrow('numericExamples');
        expect(() => renderDerivation(numeric as never, false)).toThrow('equivalents');
        expect(visible(renderSequence({...rows, ...numeric} as never, false))).toContain('Convert to a smaller unit');
        expect(visible(renderSequence({...rows, ...numeric} as never, false))).not.toContain('Convert in both directions');
    });

    it('rejects inconsistent data at every fixed entry before rendering', () => {
        const rows = sequence(pairs[0]);
        expect(() => renderSequence({...rows, equivalents: rows.equivalents.slice(1)}, false)).toThrow('must agree');
        expect(() => renderDerivation({...rows, pair: {...rows.pair, factor: 100}}, false)).toThrow('must agree');
        expect(() => renderDerivation({largeUnitCount: 4, unitsPerLarge: 2, smallUnitCount: 9}, false)).toThrow('must agree');
        const numeric = values(pairs[5], 'decimal');
        const examples = numeric.numericExamples;
        for (const equalities of [
            [examples.equalities[0], examples.equalities[0]],
            [{...examples.equalities[0], smallerHundredths: 7501}, examples.equalities[1]]
        ]) expect(() => renderValues({...numeric, numericExamples: {...examples, equalities: equalities as never}}, false))
            .toThrow('must agree');
    });
});
