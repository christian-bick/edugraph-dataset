import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FractionEquivalenceGenerator} from '../../../generators/fraction/fraction-equivalence/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {
    FractionLineProblem,
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
    fraction: {numerator: 8, denominator: 4, notation: '8/4'},
    relation: 'equal',
    equation: '2 = 8/4'
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
    it('projects whole-number equivalence as distinct formalization and explanation artifacts', () => {
        const formalization = render(wholeNumberData, 'formalization', true);
        const explanationQuestion = render(wholeNumberData, 'explanation');
        const explanationSolution = render(wholeNumberData, 'explanation', true);

        expect(formalization).toContain('2 = 8/4');
        expect(formalization).not.toContain('contains 2 groups');
        expect(explanationQuestion).toContain('explain why the values are equal');
        expect(explanationSolution).toContain('8/4 contains 2 groups of 4/4');
    });

    it('keeps the 100/100 endpoint label inside the number-line viewport', () => {
        const markup = render(wholeTenthsData(), 'explanation', true);
        expect(markup).toMatch(/text-anchor="end"[^>]*>100\/100<\/text>/);
    });
});
