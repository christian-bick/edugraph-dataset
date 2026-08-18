import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {DecimalNotationGenerator} from '../../../generators/fraction/decimal-notation/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {DecimalNotationProblem} from '../../../types/problems.ts';
import {
    isValidDecimalNotationProblem,
    pointLabelTransform
} from './decimal-notation-helpers.ts';
import {NumbersDecimalLineCore} from './numbers-decimal-line/view.tsx';
import {NumbersDecimalMeasurementCore} from './numbers-decimal-measurement/view.tsx';
import {NumbersDecimalNotationCore} from './numbers-decimal-notation/view.tsx';

const generator = new DecimalNotationGenerator();

const generate = (seed: string): DecimalNotationProblem => {
    setSeed(seed);
    return generator.generate({}).data;
};

const findDecimal = (decimalNotation: string): DecimalNotationProblem => {
    for (let index = 0; index < 3000; index++) {
        const data = generate(`decimal-view-${decimalNotation}-${index}`);
        if (data.value.decimalNotation === decimalNotation) return data;
    }
    throw new Error(`Could not generate ${decimalNotation}.`);
};

const payload = <ViewId extends 'numbers-decimal-notation' | 'numbers-decimal-line' | 'numbers-decimal-measurement'>(
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
    it('accepts tenths, hundredths, and edge values from the generator contract', () => {
        const seen = new Set<string>();
        for (let index = 0; index < 400; index++) {
            const data = generate(`decimal-view-valid-${index}`);
            expect(isValidDecimalNotationProblem(data)).toBe(true);
            seen.add(data.value.precision);
        }
        expect(seen).toEqual(new Set(['tenths', 'hundredths']));
        expect(isValidDecimalNotationProblem(findDecimal('0.01'))).toBe(true);
        expect(isValidDecimalNotationProblem(findDecimal('0.09'))).toBe(true);
        expect(isValidDecimalNotationProblem(findDecimal('0.91'))).toBe(true);
        expect(isValidDecimalNotationProblem(findDecimal('0.99'))).toBe(true);
    });

    it('rejects contradictory value, place, grid, task, line, and measurement evidence', () => {
        const source = findDecimal('0.91');
        const mutations: Array<(data: DecimalNotationProblem) => void> = [
            data => { data.value.decimalNotation = '0.19'; },
            data => { data.placeValue.columns[1].digit += 1; },
            data => { data.models.fractionGrid.cells[0]!.xPercent += 1; },
            data => { data.models.hundredthsGrid.cells[0]!.source = 'first-addend'; },
            data => { data.notationTasks.fractionToDecimal.explanation = 'The answer is obvious.'; },
            data => { data.numberLine.ticks[1]!.kind = 'major'; },
            data => { data.numberLine.point.xPercent += 1; },
            data => { data.measurement.measuredEndpoint.tickIndex -= 1; },
            data => { data.measurement.solutionEquation = data.measurement.questionEquation; }
        ];
        for (const mutate of mutations) {
            expect(isValidDecimalNotationProblem(changed(source, mutate))).toBe(false);
        }
    });

    it('returns false rather than throwing for malformed nested payloads', () => {
        const source = findDecimal('0.91');
        for (const key of ['value', 'placeValue', 'models', 'notationTasks', 'numberLine', 'measurement'] as const) {
            const malformed = structuredClone(source) as unknown as Record<string, unknown>;
            malformed[key] = null;
            expect(() => isValidDecimalNotationProblem(
                malformed as unknown as DecimalNotationProblem
            )).not.toThrow();
            expect(isValidDecimalNotationProblem(
                malformed as unknown as DecimalNotationProblem
            )).toBe(false);
        }
        const missingTicks = structuredClone(source);
        missingTicks.numberLine.ticks = null as never;
        expect(() => isValidDecimalNotationProblem(missingTicks)).not.toThrow();
        expect(isValidDecimalNotationProblem(missingTicks)).toBe(false);
    });

    it('clamps point labels at both edges and centers interior labels', () => {
        expect(pointLabelTransform(1)).toBe('translateX(0)');
        expect(pointLabelTransform(50)).toBe('translateX(-50%)');
        expect(pointLabelTransform(99)).toBe('translateX(-100%)');
    });

    it('withholds the requested notation in both conversion directions', () => {
        const data = findDecimal('0.91');
        const formalQuestion = renderToStaticMarkup(<NumbersDecimalNotationCore
            config={{conversionDirection: 'fraction-to-decimal'}}
            payload={payload('numbers-decimal-notation', data, false)}
        />);
        const formalSolution = renderToStaticMarkup(<NumbersDecimalNotationCore
            config={{conversionDirection: 'fraction-to-decimal'}}
            payload={payload('numbers-decimal-notation', data, true)}
        />);
        expect(formalQuestion).not.toContain(data.value.decimalNotation);
        expect(formalSolution).toContain(data.equality);

        const interpretQuestion = renderToStaticMarkup(<NumbersDecimalNotationCore
            config={{conversionDirection: 'decimal-to-fraction'}}
            payload={payload('numbers-decimal-notation', data, false)}
        />);
        const interpretSolution = renderToStaticMarkup(<NumbersDecimalNotationCore
            config={{conversionDirection: 'decimal-to-fraction'}}
            payload={payload('numbers-decimal-notation', data, true)}
        />);
        expect(interpretQuestion).not.toContain(data.value.fractionNotation);
        expect(interpretSolution).toContain(data.notationTasks.decimalToFraction.solutionEquation);
    });

    it('withholds the line point and the decimal measurement answer in Question Mode', () => {
        const data = findDecimal('0.91');
        const lineQuestion = renderToStaticMarkup(<NumbersDecimalLineCore
            config={{}}
            payload={payload('numbers-decimal-line', data, false)}
        />);
        const lineSolution = renderToStaticMarkup(<NumbersDecimalLineCore
            config={{}}
            payload={payload('numbers-decimal-line', data, true)}
        />);
        expect(lineQuestion).not.toContain('bg-rose-600');
        expect(lineQuestion).not.toContain(data.numberLine.answerStatement);
        expect(lineSolution).toContain('bg-rose-600');
        expect(lineSolution).toContain(data.numberLine.answerStatement);

        const measurementQuestion = renderToStaticMarkup(<NumbersDecimalMeasurementCore
            config={{}}
            payload={payload('numbers-decimal-measurement', data, false)}
        />);
        const measurementSolution = renderToStaticMarkup(<NumbersDecimalMeasurementCore
            config={{}}
            payload={payload('numbers-decimal-measurement', data, true)}
        />);
        expect(measurementQuestion).not.toContain(data.value.decimalNotation);
        expect(measurementQuestion).not.toContain(data.measurement.answerStatement);
        expect(measurementSolution).toContain(data.measurement.decimalMeasure);
        expect(measurementSolution).toContain(data.measurement.answerStatement);
    });
});
