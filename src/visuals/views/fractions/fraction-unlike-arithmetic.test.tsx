import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FractionArithmeticProblem, UnlikeFractionOperationProblem, UnlikeMixedOperationProblem} from '../../../types/problems.ts';
import {isValidFractionArithmeticProblem} from './fraction-arithmetic-helpers.ts';
import {presentFractionArithmeticProblem} from './fraction-arithmetic-presentation.ts';
import {FractionArithmeticView} from './fraction-arithmetic-view.tsx';

type Mutable<T> = {-readonly [Key in keyof T]: Mutable<T[Key]>};

const nonleastAddition: UnlikeFractionOperationProblem = {
    task: 'unlike-fraction-operation', operation: 'addition', sharedWhole: 1,
    storyContext: 'route-length', commonDenominator: 24,
    first: {numerator: 1, denominator: 3},
    second: {numerator: 1, denominator: 4},
    firstConversion: {factor: 8, fractionalNumeratorAtCommonDenominator: 8, improperNumeratorAtCommonDenominator: 8},
    secondConversion: {factor: 6, fractionalNumeratorAtCommonDenominator: 6, improperNumeratorAtCommonDenominator: 6},
    resultAtCommonDenominator: {numerator: 14, denominator: 24},
    result: {numerator: 7, denominator: 12}
};

const unlikeSubtraction: UnlikeFractionOperationProblem = {
    task: 'unlike-fraction-operation', operation: 'subtraction', sharedWhole: 1,
    storyContext: 'route-length', commonDenominator: 12,
    first: {numerator: 3, denominator: 4},
    second: {numerator: 1, denominator: 6},
    firstConversion: {factor: 3, fractionalNumeratorAtCommonDenominator: 9, improperNumeratorAtCommonDenominator: 9},
    secondConversion: {factor: 2, fractionalNumeratorAtCommonDenominator: 2, improperNumeratorAtCommonDenominator: 2},
    resultAtCommonDenominator: {numerator: 7, denominator: 12},
    result: {numerator: 7, denominator: 12}
};

const integerAddition: UnlikeFractionOperationProblem = {
    task: 'unlike-fraction-operation', operation: 'addition', sharedWhole: 1,
    storyContext: 'route-length', commonDenominator: 12,
    first: {numerator: 1, denominator: 3},
    second: {numerator: 10, denominator: 6},
    firstConversion: {factor: 4, fractionalNumeratorAtCommonDenominator: 4, improperNumeratorAtCommonDenominator: 4},
    secondConversion: {factor: 2, fractionalNumeratorAtCommonDenominator: 20, improperNumeratorAtCommonDenominator: 20},
    resultAtCommonDenominator: {numerator: 24, denominator: 12},
    result: {numerator: 2, denominator: 1}
};

const mixedAddition: UnlikeMixedOperationProblem = {
    task: 'unlike-mixed-operation', operation: 'addition', sharedWhole: 1,
    storyContext: 'route-length', commonDenominator: 6,
    first: {whole: 1, numerator: 1, denominator: 2},
    second: {whole: 2, numerator: 1, denominator: 3},
    firstConversion: {factor: 3, fractionalNumeratorAtCommonDenominator: 3, improperNumeratorAtCommonDenominator: 9},
    secondConversion: {factor: 2, fractionalNumeratorAtCommonDenominator: 2, improperNumeratorAtCommonDenominator: 14},
    resultAtCommonDenominator: {numerator: 23, denominator: 6},
    result: {whole: 3, numerator: 5, denominator: 6}
};

const mixedSubtraction: UnlikeMixedOperationProblem = {
    task: 'unlike-mixed-operation', operation: 'subtraction', sharedWhole: 1,
    storyContext: 'route-length', commonDenominator: 12,
    first: {whole: 3, numerator: 1, denominator: 4},
    second: {whole: 1, numerator: 2, denominator: 3},
    firstConversion: {factor: 3, fractionalNumeratorAtCommonDenominator: 3, improperNumeratorAtCommonDenominator: 39},
    secondConversion: {factor: 4, fractionalNumeratorAtCommonDenominator: 8, improperNumeratorAtCommonDenominator: 20},
    resultAtCommonDenominator: {numerator: 19, denominator: 12},
    result: {whole: 1, numerator: 7, denominator: 12}
};

const mixedLegendSubtraction: UnlikeMixedOperationProblem = {
    task: 'unlike-mixed-operation', operation: 'subtraction', sharedWhole: 1,
    storyContext: 'route-length', commonDenominator: 8,
    first: {whole: 2, numerator: 1, denominator: 2},
    second: {whole: 1, numerator: 7, denominator: 8},
    firstConversion: {factor: 4, fractionalNumeratorAtCommonDenominator: 4, improperNumeratorAtCommonDenominator: 20},
    secondConversion: {factor: 1, fractionalNumeratorAtCommonDenominator: 7, improperNumeratorAtCommonDenominator: 15},
    resultAtCommonDenominator: {numerator: 5, denominator: 8},
    result: {whole: 0, numerator: 5, denominator: 8}
};

const render = (data: FractionArithmeticProblem, layout: 'model' | 'word', isSolutionView: boolean) => {
    const viewId = layout === 'model' ? 'fractions-operation-model' : 'fractions-word-problem';
    return renderToStaticMarkup(<FractionArithmeticView
        layout={layout}
        presentation={layout === 'model' ? 'execution-model' : 'execution-word'}
        viewId={viewId}
        payload={{
            problem: {type: 'fraction', data, labels: []},
            viewId, targetLabels: [], isSolutionView, seed: 1
        }}
    />);
};

describe('unlike-denominator fraction arithmetic views', () => {
    it.each([nonleastAddition, unlikeSubtraction, integerAddition, mixedAddition, mixedSubtraction, mixedLegendSubtraction])(
        'validates and projects $task $operation with exact supplied conversions', data => {
            expect(isValidFractionArithmeticProblem(data)).toBe(true);
            const presentation = presentFractionArithmeticProblem(data, 'execution-model');
            expect(presentation?.task).toBe(data.task);
            expect(presentation).toHaveProperty('commonDenominator', data.commonDenominator);
            expect(presentation).toHaveProperty('resultModel.denominator', data.commonDenominator);
            expect(presentation).toHaveProperty('resultModel.groups');
        }
    );

    it('keeps original unlike partitions and a complete measured-length story in both leaves', () => {
        for (const layout of ['model', 'word'] as const) {
            const question = render(nonleastAddition, layout, false);
            const solution = render(nonleastAddition, layout, true);
            expect(question).toContain('1/3');
            expect(question).toContain('1/4');
            expect(question).toContain('repeat(3, minmax(0, 1fr))');
            expect(question).toContain('repeat(4, minmax(0, 1fr))');
            expect(question).not.toContain('8/24');
            expect(question).not.toContain('6/24');
            expect(question).not.toContain('14/24');
            expect(question).not.toContain('7/12');
            expect(solution).toContain('1/3 × 8/8 = 8/24');
            expect(solution).toContain('1/4 × 6/6 = 6/24');
            expect(solution).toContain('8/24 + 6/24 = 14/24');
            expect(solution).toContain('14/24 = 7/12');
            expect(solution).toContain('repeat(24, minmax(0, 1fr))');
            if (layout === 'word') {
                expect(question).toContain('1/3 of a mile long');
                expect(question).toContain('1/4 of a mile long');
                expect(question).toContain('Both distances use the same mile as one whole.');
                expect(question).toContain('How many miles long are the two sections altogether?');
                expect(solution).toContain('Both distances use the same mile as one whole.');
            } else {
                expect(solution).toContain('The sum is 7/12.');
                expect(solution).not.toContain('The two sections are');
            }
        }
    });

    it('shows subtraction as remaining and removed parts after exact conversions', () => {
        const question = render(unlikeSubtraction, 'word', false);
        const solution = render(unlikeSubtraction, 'word', true);
        expect(question).toContain('3/4');
        expect(question).toContain('1/6');
        expect(question).not.toContain('9/12');
        expect(solution).toContain('9/12 − 2/12 = 7/12');
        expect(solution).toContain('Remaining: 7/12 remains');
        expect(solution).toContain('Removed: 2/12 removed');
        expect(solution).toContain('How many miles remain?');
    });

    it('reads fraction measures naturally and names a denominator-one result as a whole number', () => {
        const question = render(integerAddition, 'word', false);
        const solution = render(integerAddition, 'word', true);
        expect(question).toContain('1/3 of a mile long');
        expect(question).toContain('10/6 of a mile long');
        expect(question).not.toContain('2 miles long altogether');
        expect(solution).toContain('24/12 = 2');
        expect(solution).toContain('The two sections are 2 miles long altogether.');
        expect(solution).not.toContain('2/1 miles');
        expect(render(integerAddition, 'model', true)).toContain('The sum is 2.');
        expect(render(unlikeSubtraction, 'model', true)).toContain('The difference is 7/12.');
    });

    it('keeps mixed originals in Q and exposes mixed replacements and improper calculation in S', () => {
        const question = render(mixedSubtraction, 'model', false);
        const solution = render(mixedSubtraction, 'model', true);
        expect(question).toContain('3 1/4');
        expect(question).toContain('1 2/3');
        expect(question).not.toContain('3 3/12');
        expect(question).not.toContain('1 8/12');
        expect(question).not.toContain('1 7/12');
        expect(solution).toContain('3 1/4 = 3 3/12 = 39/12');
        expect(solution).toContain('1 2/3 = 1 8/12 = 20/12');
        expect(solution).toContain('39/12 − 20/12 = 19/12');
        expect(solution).toContain('19/12 = 1 7/12');
        expect(solution).toContain('mile 4');
        expect(render(mixedAddition, 'word', true)).toContain('23/6 = 3 5/6');
    });

    it('spells out whole parts in original, converted, and result model labels', () => {
        const question = render(mixedLegendSubtraction, 'word', false);
        const solution = render(mixedSubtraction, 'word', true);
        expect(question).toContain('First amount: 2 wholes + 1/2');
        expect(question).toContain('Second amount: 1 whole + 7/8');
        expect(question).not.toContain('Second amount: 17/8');
        expect(solution).toContain('First amount: 3 wholes + 3/12');
        expect(solution).toContain('Second amount: 1 whole + 8/12');
        expect(solution).toContain('>1 whole + 7/12</span>');
    });

    it('rejects incorrect factors, replacement numerators, results, and layout overflow', () => {
        const change = (update: (data: Mutable<UnlikeFractionOperationProblem>) => void) => {
            const data: Mutable<UnlikeFractionOperationProblem> = structuredClone(nonleastAddition);
            update(data);
            return data;
        };
        for (const invalid of [
            change(data => {data.firstConversion.factor = 4;}),
            change(data => {data.secondConversion.fractionalNumeratorAtCommonDenominator = 7;}),
            change(data => {data.resultAtCommonDenominator.numerator = 15;}),
            change(data => {data.result.numerator = 14; data.result.denominator = 24;}),
            change(data => {data.second.denominator = 3;}),
            change(data => {data.commonDenominator = 48;}),
            change(data => {data.first = null as never;})
        ]) {
            expect(isValidFractionArithmeticProblem(invalid)).toBe(false);
            expect(() => render(invalid, 'model', true)).toThrow();
        }
    });
});
