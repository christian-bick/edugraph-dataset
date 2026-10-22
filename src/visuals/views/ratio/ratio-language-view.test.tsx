import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {RatioRelationProblem, UnitRateRelationProblem} from '../../../types/problems.ts';
import {RatioLanguageBody, UnitRateLanguageBody, UnitRateProblemBody} from './ratio-language-view.tsx';

const ratio: RatioRelationProblem = {
    kind: 'ratio-relation',
    antecedent: {name: 'red beads', unit: 'beads', value: {numerator: 3, denominator: 1}},
    consequent: {name: 'blue beads', unit: 'beads', value: {numerator: 2, denominator: 1}}
};
const rate: UnitRateRelationProblem = {
    kind: 'unit-rate', context: 'price',
    antecedent: {name: 'cost', unit: 'dollars', value: {numerator: 15, denominator: 1}},
    consequent: {name: 'apples', unit: 'kilograms', value: {numerator: 6, denominator: 1}},
    unitRate: {numerator: 5, denominator: 2}, scaleFactor: {numerator: 1, denominator: 3},
    scaled: {antecedent: {numerator: 5, denominator: 1}, consequent: {numerator: 2, denominator: 1}}
};

describe('ratio language task projections', () => {
    it('preserves ordered named quantities and withholds only the interpretation', () => {
        const question = renderToStaticMarkup(<RatioLanguageBody data={ratio} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<RatioLanguageBody data={ratio} isSolutionView={true} />);
        expect(question).toContain('red beads');
        expect(question).toContain('blue beads');
        expect(question).toContain('3 : 2');
        expect(question).not.toContain('For every 3 red beads');
        expect(solution).toContain('For every 3 red beads, there are 2 blue beads.');
        expect(question).toMatch(/class="[^"]*border-dashed[^"]*" data-response="ratio-meaning"/);
        expect(question).not.toContain('bg-emerald-50');
        expect(solution).toMatch(/class="[^"]*bg-emerald-50[^"]*text-emerald-950[^"]*" data-response="ratio-meaning"/);
    });

    it('retains measured-material units in both the premise and written interpretation', () => {
        const measuredRatio: RatioRelationProblem = {
            kind: 'ratio-relation',
            antecedent: {name: 'flour', unit: 'cups', value: {numerator: 3, denominator: 1}},
            consequent: {name: 'water', unit: 'cups', value: {numerator: 1, denominator: 1}}
        };
        const question = renderToStaticMarkup(<RatioLanguageBody data={measuredRatio} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<RatioLanguageBody data={measuredRatio} isSolutionView={true} />);
        expect(question).toContain('flour (cups)');
        expect(question).toContain('water (cups)');
        expect(question).not.toContain('For every 3 cups of flour');
        expect(solution).toContain('For every 3 cups of flour, there is 1 cup of water.');
    });

    it('keeps normalization and scaled equivalence visible without giving the written meaning', () => {
        const question = renderToStaticMarkup(<UnitRateLanguageBody data={rate} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<UnitRateLanguageBody data={rate} isSolutionView={true} />);
        expect(question).toContain('15 ÷ 6 = 5/2');
        expect(question).toContain('6 ÷ 6 = 1');
        expect(question).toContain('15 × 1/3 = 5');
        expect(question).toContain('6 × 1/3 = 2');
        expect(question).not.toContain('For every 1 kilogram of apples,');
        expect(solution).toContain('For every 1 kilogram of apples, the cost is 5/2 dollars.');
        expect(question).toMatch(/class="[^"]*border-dashed[^"]*" data-response="unit-rate-meaning"/);
        expect(question).not.toContain('bg-emerald-50');
        expect(solution).toMatch(/class="[^"]*bg-emerald-50[^"]*text-emerald-950[^"]*" data-response="unit-rate-meaning"/);
    });

    it('keeps word-problem givens in prose and hides every computed answer until solution mode', () => {
        const question = renderToStaticMarkup(<UnitRateProblemBody data={rate} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<UnitRateProblemBody data={rate} isSolutionView={true} />);
        expect(question).toContain('6 kilograms of apples costs 15 dollars');
        expect(question).toContain('cost of 2 kilograms of apples');
        expect(question).not.toContain('5/2');
        expect(question).not.toContain('1/3');
        expect(question).not.toContain('is 5 dollars');
        expect(solution).toContain('Ordered ratio: cost to apples');
        expect(solution).toContain('15 ÷ 6 = 5/2');
        expect(solution).toContain('15 × 1/3 = 5');
        expect(solution).toContain('2 kilograms of apples is 5 dollars');
        expect(question).toMatch(/class="[^"]*border-dashed[^"]*" data-response="unit-rate-work"/);
        expect(question).not.toContain('bg-emerald-50');
        expect(solution).toMatch(/class="[^"]*bg-emerald-50[^"]*text-emerald-950[^"]*" data-response="unit-rate-answer"/);
    });
});
