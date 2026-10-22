import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {FractionDivisionRelationProblem} from '../../../types/problems.ts';
import {GeneralFractionDivisionBody, type GeneralFractionDivisionTask} from './fraction-division-view.tsx';

const data: FractionDivisionRelationProblem = {
    kind: 'fraction-division-relation', operandProfile: 'fraction-by-fraction',
    dividend: {numerator: 7, denominator: 6}, divisor: {numerator: 3, denominator: 4},
    quotient: {numerator: 14, denominator: 9}, reciprocal: {numerator: 4, denominator: 3}, reciprocalProduct: {numerator: 28, denominator: 18},
    inverse: {quotientFactor: {numerator: 14, denominator: 9}, divisorFactor: {numerator: 3, denominator: 4}, reconstructedDividend: {numerator: 7, denominator: 6}},
    model: {kind: 'common-unit-groups', ticksPerWhole: 12, dividendTicks: 14, divisorTicks: 9, completeGroups: 1,
        remainderTicks: 5, fractionalGroup: {numerator: 5, denominator: 9}, coverageTicks: 18,
        groups: [{startTick: 0, endTick: 9, filledTicks: 9}, {startTick: 9, endTick: 18, filledTicks: 5}]},
    context: {kind: 'sharing', material: 'juice', measureUnit: 'liter', groupUnit: 'batch',
        totalMeasure: {numerator: 7, denominator: 6}, groupCount: {numerator: 3, denominator: 4}, measurePerGroup: {numerator: 14, denominator: 9}},
    equationWitness: {firstFactor: {numerator: 3, denominator: 4}, secondFactor: {numerator: 14, denominator: 9}, product: {numerator: 7, denominator: 6}},
    multiplicationWitness: {unreducedProduct: {numerator: 42, denominator: 36}, reconstructedDividend: {numerator: 7, denominator: 6}}
};
const render = (task: GeneralFractionDivisionTask, solution: boolean, problem = data): string =>
    renderToStaticMarkup(<GeneralFractionDivisionBody data={problem} isSolutionView={solution} task={task} />);
const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('general fraction division task projections', () => {
    it('shows a truthful fractional last group without rounding it into a complete group', () => {
        const question = render('division-execution', false);
        const solution = render('division-execution', true);
        expect(text(question)).toContain('(7/6) ÷ (3/4) = □');
        expect(question).not.toContain('14/9');
        expect(question).not.toContain('5/9');
        const groupWidths = [...question.matchAll(/<rect[^>]* y="147" width="([^"]+)"/g)].map(match => Number(match[1]));
        expect(groupWidths).toHaveLength(4);
        expect(groupWidths[3]! / groupWidths[2]!).toBeCloseTo(5 / 9, 12);
        expect(text(solution)).toContain('1 complete divisor-sized group and 5/9 of another group (5 of its 9 equal ticks)');
        expect(text(solution)).toContain('(7/6) × (4/3) = 28/18 = 14/9');
    });

    it('gives model construction only a blank frame until the completed drawing is revealed in green', () => {
        const question = render('division-model-construction', false);
        const solution = render('division-model-construction', true);
        expect(question).toContain('Blank numerical model frame');
        expect(question).not.toContain('Divisor-sized groups');
        expect(question).not.toContain('Dividend:');
        expect(question).not.toContain('14/9');
        expect(question).not.toContain('y="147"');
        expect(solution).toContain('Numerical common-part model');
        expect(solution).toContain('fill="#86efac"');
        expect(text(solution)).toContain('The exact quotient is 14/9');
    });

    it('keeps story creation free of the stored context and gives one contextually correct solution story', () => {
        const question = render('division-story-creation', false);
        const otherContext = {...data, context: {kind: 'rectangle', lengthUnit: 'meter', areaUnit: 'square meter',
            area: data.dividend, firstSide: data.divisor, secondSide: data.quotient}} as FractionDivisionRelationProblem;
        expect(question).toBe(render('division-story-creation', false, otherContext));
        expect(question).not.toContain('juice');
        expect(question).not.toContain('batch');
        expect(question).not.toContain('One possible story');
        expect(text(render('division-story-creation', true))).toContain('Answer: 14/9 liters per batch');
    });

    it('keeps word-problem context necessary for the requested units without exposing a solved model or quotient', () => {
        const question = render('division-word-problem', false);
        const solution = render('division-word-problem', true);
        expect(text(question)).toContain('7/6 liters of juice make 3/4 batches');
        expect(question).not.toContain('<svg');
        expect(question).not.toContain('14/9');
        expect(text(question)).toContain('Equation: ____________________');
        expect(text(question)).toContain('Check by multiplication: ____________________');
        expect(question).not.toContain('data-evidence="product-relation"');
        expect(text(solution)).toContain('14/9 liters per batch');
        expect(solution).toContain('Numerical common-part model');
        const noMultiplication = {...data, multiplicationWitness: undefined};
        expect(render('division-word-problem', false, noMultiplication)).not.toContain('Check by multiplication:');
    });

    it('asks for the inverse explanation while treating the quotient as a given premise', () => {
        const question = render('division-inverse-explanation', false);
        const solution = render('division-inverse-explanation', true);
        expect(text(question)).toContain('(7/6) ÷ (3/4) = 14/9');
        expect(text(question)).toContain('(14/9) × (3/4) = □');
        expect(question).not.toContain('28/18');
        expect(question).not.toContain('leaving a/b');
        expect(text(solution)).toContain('(a/b) ÷ (c/d) = (a × d)/(b × c)');
        expect(text(solution)).toContain('(14/9) × (3/4) = 42/36 = 7/6');
    });

    it.each(['division-execution', 'division-interpretation', 'division-story-creation', 'division-model-construction'] as const)(
        'preserves optional mathematical claims in %s without revealing the quotient', task => {
            const question = render(task, false);
            const solution = render(task, true);
            expect(question).toContain('data-evidence="product-relation"');
            expect(text(question)).toContain('(3/4) × □ = 7/6');
            expect(question).not.toContain('14/9');
            expect(question).not.toContain('emerald');
            expect(solution).toContain('emerald');
            expect(text(solution)).toContain('(14/9) × (3/4) = 42/36 = 7/6');
        });
});
