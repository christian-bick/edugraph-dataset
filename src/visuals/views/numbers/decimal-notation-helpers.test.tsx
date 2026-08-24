import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {DecimalNotationGenerator} from '../../../generators/fraction/decimal-notation/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {DecimalNotationProblem} from '../../../types/problems.ts';
import {
    getDecimalNotationPresentation,
    isValidDecimalNotationProblem,
    pointLabelTransform
} from './decimal-notation-helpers.ts';
import {NumbersDecimalLineCore} from './numbers-decimal-line/view.tsx';
import {NumbersDecimalMeasurementCore} from './numbers-decimal-measurement/view.tsx';
import {
    DecimalNotationViewId,
    NumbersDecimalNotationView
} from './numbers-decimal-notation-view.tsx';

const generator = new DecimalNotationGenerator();

const generate = (seed: string): DecimalNotationProblem => {
    setSeed(seed);
    return generator.generate({}).data;
};

const findDecimal = (decimalNotation: string): DecimalNotationProblem => {
    for (let index = 0; index < 3000; index++) {
        const data = generate(`decimal-view-${decimalNotation}-${index}`);
        if (getDecimalNotationPresentation(data).decimalNotation === decimalNotation) return data;
    }
    throw new Error(`Could not generate ${decimalNotation}.`);
};

type DecimalViewId = DecimalNotationViewId
    | 'numbers-decimal-line'
    | 'numbers-decimal-measurement';

const payload = <ViewId extends DecimalViewId>(
    viewId: ViewId,
    data: DecimalNotationProblem,
    isSolutionView: boolean
): ViewRenderPayload<ViewId> => ({
    problem: {type: 'fraction', data},
    viewId,
    labels: [],
    isSolutionView,
    seed: 17
});

const changed = (
    source: DecimalNotationProblem,
    update: (data: DecimalNotationProblem) => void
): DecimalNotationProblem => {
    const data = structuredClone(source);
    update(data);
    return data;
};

describe('decimal notation view contract', () => {
    it('accepts canonical tenths, hundredths, and edge values', () => {
        const seen = new Set<string>();
        for (let index = 0; index < 400; index++) {
            const data = generate(`decimal-view-valid-${index}`);
            expect(isValidDecimalNotationProblem(data)).toBe(true);
            seen.add(getDecimalNotationPresentation(data).precision);
        }
        expect(seen).toEqual(new Set(['tenths', 'hundredths']));
        for (const decimal of ['0.01', '0.09', '0.91', '0.99']) {
            expect(isValidDecimalNotationProblem(findDecimal(decimal))).toBe(true);
        }
    });

    it('rejects contradictory canonical equivalence data', () => {
        const source = findDecimal('0.91');
        const mutations: Array<(data: DecimalNotationProblem) => void> = [
            data => { data.sharedWhole = 0 as never; },
            data => { data.value.denominator = 20 as never; },
            data => { data.value.numerator = 100; },
            data => { data.value.wholeDigit = 1 as never; },
            data => { data.value.tenthsDigit += 1; },
            data => { data.value.hundredthsDigit = null; },
            data => { data.value.hundredthsNumerator += 1; }
        ];
        for (const mutate of mutations) {
            expect(isValidDecimalNotationProblem(changed(source, mutate))).toBe(false);
        }
    });

    it('returns false rather than throwing for malformed nested payloads', () => {
        const malformed = structuredClone(findDecimal('0.91')) as unknown as Record<string, unknown>;
        malformed.value = null;
        expect(() => isValidDecimalNotationProblem(
            malformed as unknown as DecimalNotationProblem
        )).not.toThrow();
        expect(isValidDecimalNotationProblem(
            malformed as unknown as DecimalNotationProblem
        )).toBe(false);
    });

    it('derives coherent notation, grids, place values, scales, and measurement text', () => {
        const data = findDecimal('0.91');
        const presentation = getDecimalNotationPresentation(data);
        expect(presentation).toMatchObject({
            fractionNotation: '91/100',
            decimalNotation: '0.91',
            precision: 'hundredths',
            equality: '91/100 = 0.91',
            placeValue: {
                columns: [
                    {place: 'ones', digit: 0, unitFraction: '1'},
                    {place: 'tenths', digit: 9, unitFraction: '1/10'},
                    {place: 'hundredths', digit: 1, unitFraction: '1/100'}
                ],
                equation: '0.91 = 0 × 1 + 9 × 1/10 + 1 × 1/100'
            },
            numberLine: {
                subdivisionCount: 100,
                point: {tickIndex: 91, xPercent: 91, label: '0.91'}
            },
            measurement: {
                fractionalMeasure: '91/100 of a meter',
                decimalMeasure: '0.91 meters'
            }
        });
        expect(presentation.models.fractionGrid.cells).toHaveLength(100);
        expect(presentation.models.fractionGrid.shadedCount).toBe(91);
        expect(presentation.models.hundredthsGrid.shadedCount).toBe(91);
        expect(presentation.numberLine.ticks).toHaveLength(101);
        expect(presentation.measurement.ticks).toEqual(presentation.numberLine.ticks);
        expect(presentation.measurement.ticks).not.toBe(presentation.numberLine.ticks);
    });

    it('clamps point labels at both edges and centers interior labels', () => {
        expect(pointLabelTransform(1)).toBe('translateX(0)');
        expect(pointLabelTransform(50)).toBe('translateX(-50%)');
        expect(pointLabelTransform(99)).toBe('translateX(-100%)');
    });

    it('withholds the requested notation in both invariant leaf views', () => {
        const data = findDecimal('0.91');
        const presentation = getDecimalNotationPresentation(data);
        const formalQuestion = renderToStaticMarkup(<NumbersDecimalNotationView
            direction="fraction-to-decimal"
            payload={payload('numbers-fraction-to-decimal', data, false)}
            viewId="numbers-fraction-to-decimal"
        />);
        const formalSolution = renderToStaticMarkup(<NumbersDecimalNotationView
            direction="fraction-to-decimal"
            payload={payload('numbers-fraction-to-decimal', data, true)}
            viewId="numbers-fraction-to-decimal"
        />);
        expect(formalQuestion).not.toContain(presentation.decimalNotation);
        expect(formalSolution).toContain(presentation.equality);

        const interpretQuestion = renderToStaticMarkup(<NumbersDecimalNotationView
            direction="decimal-to-fraction"
            payload={payload('numbers-decimal-to-fraction', data, false)}
            viewId="numbers-decimal-to-fraction"
        />);
        const interpretSolution = renderToStaticMarkup(<NumbersDecimalNotationView
            direction="decimal-to-fraction"
            payload={payload('numbers-decimal-to-fraction', data, true)}
            viewId="numbers-decimal-to-fraction"
        />);
        expect(interpretQuestion).not.toContain(presentation.fractionNotation);
        expect(interpretQuestion).toContain('Blank numerator over denominator 100');
        expect(interpretQuestion).toContain('>100</span>');
        expect(interpretSolution).toContain(presentation.notationTasks.decimalToFraction.solutionEquation);
    });

    it('withholds the line point and decimal measurement answer in Question Mode', () => {
        const data = findDecimal('0.91');
        const presentation = getDecimalNotationPresentation(data);
        const lineQuestion = renderToStaticMarkup(<NumbersDecimalLineCore
            config={{}}
            payload={payload('numbers-decimal-line', data, false)}
        />);
        const lineSolution = renderToStaticMarkup(<NumbersDecimalLineCore
            config={{}}
            payload={payload('numbers-decimal-line', data, true)}
        />);
        expect(lineQuestion).not.toContain('bg-rose-600');
        expect(lineQuestion).not.toContain(presentation.numberLine.answerStatement);
        expect(lineSolution).toContain('bg-rose-600');
        expect(lineSolution).toContain(presentation.numberLine.answerStatement);

        const measurementQuestion = renderToStaticMarkup(<NumbersDecimalMeasurementCore
            config={{}}
            payload={payload('numbers-decimal-measurement', data, false)}
        />);
        const measurementSolution = renderToStaticMarkup(<NumbersDecimalMeasurementCore
            config={{}}
            payload={payload('numbers-decimal-measurement', data, true)}
        />);
        expect(measurementQuestion).not.toContain(presentation.decimalNotation);
        expect(measurementQuestion).not.toContain(presentation.measurement.answerStatement);
        expect(measurementSolution).toContain(presentation.measurement.decimalMeasure);
        expect(measurementSolution).toContain(presentation.measurement.answerStatement);
    });
});
