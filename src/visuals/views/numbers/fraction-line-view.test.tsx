import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FractionEquivalenceGenerator} from '../../../generators/fraction/fraction-equivalence/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {
    FractionLineProblem,
    FractionNumberLineProblem,
    TenthsToHundredthsProblem,
    WholeNumberFractionEquivalenceProblem
} from '../../../types/problems.ts';
import {FractionLineMode, FractionLineView} from './fraction-line-view.tsx';

const payload = (
    data: FractionLineProblem,
    isSolutionView: boolean
): ViewRenderPayload<'numbers-fraction-line-explanation'> => ({
    problem: {type: 'fraction', data},
    viewId: 'numbers-fraction-line-explanation',
    labels: [],
    isSolutionView,
    seed: 23
});

const render = (data: FractionLineProblem, mode: FractionLineMode, isSolutionView = false) =>
    renderToStaticMarkup(<FractionLineView mode={mode} payload={payload(data, isSolutionView)} />);

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
    for (let attempt = 0; attempt < 200; attempt++) {
        setSeed(`fraction-line-whole-${attempt}`);
        const data = new FractionEquivalenceGenerator().generate({
            usesMultiplication: true,
            usesEqualShares: true,
            usesImproperFractions: false,
            usesIntegerNumbers: false
        }).data;
        if (data.task === 'tenths-to-hundredths' && data.tenths.numerator === 10) return data;
    }
    throw new Error('Expected a seeded 10/10 to 100/100 equivalence model.');
}

describe('fraction-line Ability projections', () => {
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

    it('keeps the 100/100 endpoint label inside the number-line viewport', () => {
        const data = wholeTenthsData();
        const markup = render(data, 'explanation', true);
        const endpointNotation = `${data.hundredths.numerator}/${data.hundredths.denominator}`;
        expect(markup).toContain(
            `text-anchor="end" class="fill-emerald-700 text-[20px] font-bold">${endpointNotation}</text>`
        );
    });
});
