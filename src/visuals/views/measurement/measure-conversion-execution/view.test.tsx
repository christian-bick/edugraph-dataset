import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {
    MeasurementConversionPair,
    StandardUnitEquivalencesProblem
} from '../../../../types/problems.ts';
import {getMeasurementUnitPresentation} from '../../../helpers/measurement-conversion.ts';
import {formatConversionHundredths} from '../measure-conversion-helpers.ts';
import {MeasureConversionView} from '../measure-conversion-view.tsx';

const pairs = [
    {id: 'kilometer-meter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'kilometer', smallerUnit: 'meter', factor: 1000},
    {id: 'meter-centimeter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'meter', smallerUnit: 'centimeter', factor: 100},
    {id: 'kilogram-gram', quantityKind: 'weight', scalingKind: 'magnitude', largerUnit: 'kilogram', smallerUnit: 'gram', factor: 1000},
    {id: 'pound-ounce', quantityKind: 'weight', scalingKind: 'factor', largerUnit: 'pound', smallerUnit: 'ounce', factor: 16},
    {id: 'liter-milliliter', quantityKind: 'liquid-volume', scalingKind: 'magnitude', largerUnit: 'liter', smallerUnit: 'milliliter', factor: 1000},
    {id: 'hour-minute', quantityKind: 'time', scalingKind: 'factor', largerUnit: 'hour', smallerUnit: 'minute', factor: 60},
    {id: 'minute-second', quantityKind: 'time', scalingKind: 'factor', largerUnit: 'minute', smallerUnit: 'second', factor: 60}
] as const satisfies readonly MeasurementConversionPair[];

function dataFor(
    pair: MeasurementConversionPair,
    numberKind: 'legacy' | 'integer' | 'decimal'
): StandardUnitEquivalencesProblem {
    const equivalents = Array.from({length: 5}, (_, index) => ({
        largerValue: index + 2,
        smallerValue: (index + 2) * pair.factor
    }));
    const largerHundredths = numberKind === 'decimal' ? [125, 225] : [200, 300];
    return {
        pair,
        equivalents,
        ...(numberKind === 'legacy' ? {} : {
            numericExamples: {
                numberKind,
                equalities: [
                    {largerHundredths: largerHundredths[0]!, smallerHundredths: largerHundredths[0]! * pair.factor},
                    {largerHundredths: largerHundredths[1]!, smallerHundredths: largerHundredths[1]! * pair.factor}
                ] as const
            }
        })
    };
}

function render(data: StandardUnitEquivalencesProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'measure-conversion-execution'> = {
        problem: {type: 'measurement', data, labels: []},
        viewId: 'measure-conversion-execution', targetLabels: [], isSolutionView, seed: 17
    };
    return renderToStaticMarkup(<MeasureConversionView
        mode="execution" viewId="measure-conversion-execution" payload={payload}
    />);
}

function renderDerivation(data: StandardUnitEquivalencesProblem): string {
    const payload: ViewRenderPayload<'measure-conversion-derivation'> = {
        problem: {type: 'measurement', data, labels: []},
        viewId: 'measure-conversion-derivation', targetLabels: [], isSolutionView: false, seed: 17
    };
    return renderToStaticMarkup(<MeasureConversionView
        mode="derivation" viewId="measure-conversion-derivation" payload={payload}
    />);
}

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('measure-conversion-execution task projection', () => {
    it('keeps the legacy larger-to-smaller presentation for the absent example bundle', () => {
        const data = dataFor(pairs[0], 'legacy');
        const question = visible(render(data, false));
        const solution = visible(render(data, true));
        expect(question).toContain('Convert to a smaller unit');
        expect(question).toContain('Convert 2 kilometers to meters.');
        expect(question).toContain('Multiply by × 1,000');
        expect(question).toContain('2 × 1,000 = ?');
        expect(question).not.toContain('Convert in both directions');
        expect(solution).toContain('2 × 1,000 = 2,000');
        expect(solution).toContain('2 kilometers = 2,000 meters');
    });

    it('retains the sibling derivation prompt and evidence for legacy payloads', () => {
        const question = visible(renderDerivation(dataFor(pairs[0], 'legacy')));
        expect(question).toContain('Derive a unit-size relation');
        expect(question).toContain('Use the equivalent length to determine how many meters equal 1 kilometer.');
        expect(question).toContain('2 kilometers = 2,000 meters');
        expect(question).not.toContain('Convert in both directions');
    });

    it.each(pairs)('asks both directions for $id and reveals neither target in Question', pair => {
        const data = dataFor(pair, 'decimal');
        const question = visible(render(data, false));
        const larger = getMeasurementUnitPresentation(pair.largerUnit);
        const smaller = getMeasurementUnitPresentation(pair.smallerUnit);
        const firstResult = formatConversionHundredths(125 * pair.factor);
        const secondSource = formatConversionHundredths(225 * pair.factor);
        expect(question).toContain('Convert in both directions');
        expect(question).toContain(`1.25 ${larger.symbol}`);
        expect(question).toContain(`${secondSource} ${smaller.symbol}`);
        expect(question).toContain(`1.25 × ${formatConversionHundredths(pair.factor * 100)} = ?`);
        expect(question).not.toContain(`${firstResult} ${smaller.symbol}`);
        expect(question).not.toContain(`2.25 ${larger.symbol}`);
    });

    it.each(pairs)('solves exact multiply and divide equations for $id', pair => {
        const data = dataFor(pair, 'decimal');
        const solution = visible(render(data, true));
        const firstResult = formatConversionHundredths(125 * pair.factor);
        const secondSource = formatConversionHundredths(225 * pair.factor);
        expect(solution).toContain(`1.25 × ${pair.factor.toLocaleString('en-US')} = ${firstResult}`);
        expect(solution).toContain(`${secondSource} ÷ ${pair.factor.toLocaleString('en-US')} = 2.25`);
        expect(solution).toContain('Multiply by');
        expect(solution).toContain('divide by');
    });

    it('keeps integer examples integral in both directions', () => {
        const data = dataFor(pairs[3], 'integer');
        const question = visible(render(data, false));
        const solution = visible(render(data, true));
        expect(question).toContain('2 lb');
        expect(question).toContain('48 oz');
        expect(solution).toContain('2 × 16 = 32');
        expect(solution).toContain('48 ÷ 16 = 3');
        expect(solution).not.toContain('2.00');
    });

    it('rejects inconsistent or duplicated equalities before rendering', () => {
        const data = dataFor(pairs[5], 'decimal');
        const numericExamples = data.numericExamples!;
        const broken = {...data, numericExamples: {
            ...numericExamples,
            equalities: [
                {...numericExamples.equalities[0], smallerHundredths: 7501},
                numericExamples.equalities[1]
            ] as const
        }};
        expect(() => render(broken, false)).toThrow('must agree');
        expect(() => render({...data, numericExamples: {
            ...numericExamples,
            equalities: [numericExamples.equalities[0], numericExamples.equalities[0]]
        }}, false)).toThrow('must agree');
    });
});
