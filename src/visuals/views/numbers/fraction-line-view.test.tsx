import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FractionTenthsEquivalenceGenerator} from '../../../generators/fraction/fraction-tenths-equivalence/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {
    FractionLineProblem,
    FractionNumberLineProblem,
    ProperFractionUnitScalingProblem,
    TenthsToHundredthsProblem,
    WholeNumberFractionEquivalenceProblem
} from '../../../types/problems.ts';
import {FractionLineMode, FractionLineView} from './fraction-line-view.tsx';

const payload = (
    data: FractionLineProblem,
    isSolutionView: boolean
): ViewRenderPayload<'numbers-fraction-line' | 'numbers-fraction-line-explanation'> => ({
    problem: {type: 'fraction', data, labels: []},
    viewId: 'numbers-fraction-line-explanation',
    targetLabels: [],
    isSolutionView,
    seed: 23
});

const render = (data: FractionLineProblem, mode: FractionLineMode, isSolutionView = false) =>
    renderToStaticMarkup(<FractionLineView mode={mode} payload={payload(data, isSolutionView)} />);
const visible = (markup: string) => markup.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');

const wholeNumberData: WholeNumberFractionEquivalenceProblem = {
    task: 'represent-whole-as-fraction',
    wholeNumber: 2,
    fraction: {numerator: 8, denominator: 4},
    relation: 'equal'
};

const locationData: FractionNumberLineProblem = {
    task: 'locate-fraction',
    numerator: 5,
    denominator: 4,
    wholeCount: 2,
    steps: Array.from({length: 5}, (_, index) => ({
        fromNumerator: index,
        toNumerator: index + 1
    }))
};

function wholeTenthsData(): TenthsToHundredthsProblem {
    setSeed('fraction-line-whole');
    return new FractionTenthsEquivalenceGenerator().generate({fractionMagnitude: 'equal-whole'}).data;
}

describe('fraction-line Ability projections', () => {
    it.each(['formalization', 'explanation'] as const)('supplies part-count scaling for proper-fraction %s without revealing the missing numerator', mode => {
        const data: ProperFractionUnitScalingProblem = {task: 'relate-equivalent-fractions',
            first: {numerator: 1, denominator: 2}, second: {numerator: 4, denominator: 8},
            scaleFactor: 4, unitMultiplier: {numerator: 4, denominator: 4, value: 1}, relation: 'equal'};
        const question = visible(render(data, mode)), solution = visible(render(data, mode, true));
        expect(question).toContain('part-count scaling');
        expect(question).toContain('1 × 4 = ?; 2 × 4 = 8');
        expect(question).not.toContain('1 × 4 = 4');
        expect(solution).toContain('1 × 4 = 4; 2 × 4 = 8');
        const classification = visible(render(data, 'classification'));
        expect(classification).toContain('Do 1/2 and 4/8 locate the same point?');
        expect(classification).not.toContain('part-count scaling');
        expect(classification).not.toContain('×');
    });
    it('derives fraction notation from the numeric location relation', () => {
        const question = render(locationData, 'articulation');
        const solution = render(locationData, 'articulation', true);
        const targetNotation = `${locationData.numerator}/${locationData.denominator}`;
        const unitNotation = `1/${locationData.denominator}`;

        expect(question).toContain(`locate <span class="text-blue-700">${targetNotation}</span>`);
        expect(solution).toContain(`${unitNotation} each step`);
        expect(solution).toContain(`The endpoint is ${targetNotation}`);
    });

    it('projects whole-number equivalence as distinct formalization and explanation artifacts', () => {
        const formalization = render(wholeNumberData, 'formalization', true);
        const explanationQuestion = render(wholeNumberData, 'explanation');
        const explanationSolution = render(wholeNumberData, 'explanation', true);
        const fractionNotation = `${wholeNumberData.fraction.numerator}/${wholeNumberData.fraction.denominator}`;
        const equation = `${wholeNumberData.wholeNumber} = ${fractionNotation}`;
        const wholeGroup = `${wholeNumberData.fraction.denominator}/${wholeNumberData.fraction.denominator}`;

        expect(formalization).toContain(equation);
        expect(formalization).not.toContain('contains 2 groups');
        expect(explanationQuestion).toContain('explain why the values are equal');
        expect(explanationSolution).toContain(
            `${fractionNotation} contains ${wholeNumberData.wholeNumber} groups of ${wholeGroup}`
        );
    });

    it.each([1, 2, 3])('keeps every whole-%s endpoint fraction inside the line without exposing the missing numerator', wholeNumber => {
        for (const denominator of [2, 3, 4, 6, 8]) for (const mode of ['formalization', 'explanation'] as const) {
            const data: WholeNumberFractionEquivalenceProblem = {task: 'represent-whole-as-fraction', wholeNumber,
                fraction: {numerator: wholeNumber * denominator, denominator}, relation: 'equal'};
            for (const isSolution of [false, true]) {
                const markup = render(data, mode, isSolution);
                const label = markup.match(/<text x="([\d.]+)" y="([\d.]+)" text-anchor="([^"]+)" class="fill-emerald-700 text-\[21px\] font-bold">([^<]*)<\/text>/);
                expect(label).not.toBeNull();
                // The whole-equivalence endpoint is always at the right edge.
                // Its fraction belongs inside the scale, below the whole label.
                const x = Number(label![1]), y = Number(label![2]);
                expect(x).toBeGreaterThan(54);
                expect(x).toBeLessThan(786);
                expect(label![3]).toBe('end');
                expect(y).toBeGreaterThan(101);
                expect(y).toBeLessThan(142);
                expect(label![4]).toBe(isSolution ? data.fraction.numerator + '/' + denominator : '?/' + denominator);
                expect(visible(markup).includes(wholeNumber + ' = ' + data.fraction.numerator + '/' + denominator)).toBe(isSolution);
                expect(markup).toContain('viewBox="0 0 840 285"');
                expect(markup).toContain('same point');
            }
        }
    });

    it('keeps the 100/100 endpoint label inside the number-line viewport', () => {
        const data = wholeTenthsData();
        const markup = render(data, 'explanation', true);
        const endpointNotation = `${data.hundredths.numerator}/${data.hundredths.denominator}`;
        expect(markup).toContain(
            `text-anchor="end" class="fill-emerald-700 text-[20px] font-bold">${endpointNotation}</text>`
        );
    });
});
