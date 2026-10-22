import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {PercentQuantityProblem} from '../../../types/problems.ts';
import {PercentOfQuantityBody, PercentWholeInversionBody} from './percent-quantity-view.tsx';

const data: PercentQuantityProblem = {
    kind: 'percent-quantity', percent: 25,
    perHundred: {numerator: 25, denominator: 100}, scaleFactor: {numerator: 1, denominator: 4},
    whole: {numerator: 14, denominator: 3}, part: {numerator: 7, denominator: 6}
};

const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('percent of quantity projection', () => {
    it('retains per-hundred equivalence and scaling while withholding every occurrence of the unknown part', () => {
        const question = renderToStaticMarkup(<PercentOfQuantityBody data={data} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<PercentOfQuantityBody data={data} isSolutionView={true} />);
        expect(text(question)).toContain('Find 25% of 14/3.');
        expect(text(question)).toContain('25% = 25/100 = 1/4');
        expect(text(question)).toContain('(25/100) × (14/3) = □');
        expect(question).not.toContain('7/6');
        expect(question).not.toContain('emerald');
        expect(text(solution)).toContain('(25/100) × (14/3) = 7/6');
        expect(solution).toMatch(/text-emerald-800[^>]*data-result="percent-quantity">7\/6<\/span>/);
    });

    it('omits a duplicate factor when the per-hundred fraction is already reduced', () => {
        const coprime: PercentQuantityProblem = {...data, percent: 37,
            perHundred: {numerator: 37, denominator: 100}, scaleFactor: {numerator: 37, denominator: 100},
            whole: {numerator: 100, denominator: 1}, part: {numerator: 37, denominator: 1}};
        const markup = renderToStaticMarkup(<PercentOfQuantityBody data={coprime} isSolutionView={false} />);
        expect(text(markup)).toContain('37% = 37/100');
        expect(text(markup)).not.toContain('37/100 = 37/100');
    });
});

describe('reference whole inversion projection', () => {
    it('keeps the known quantity, percentage and forward relation but withholds every occurrence of the whole', () => {
        const question = renderToStaticMarkup(<PercentWholeInversionBody data={data} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<PercentWholeInversionBody data={data} isSolutionView={true} />);
        expect(text(question)).toContain('7/6 is 25% of what quantity?');
        expect(text(question)).toContain('25% = 25/100 = 1/4');
        expect(text(question)).toContain('7/6 = (25/100) × □');
        expect(question).not.toContain('14/3');
        expect(question).not.toContain('emerald');
        expect(question).not.toContain('÷');
        expect(text(solution)).toContain('7/6 = (25/100) × 14/3');
        expect(text(solution)).toContain('(7/6) ÷ (1/4) = 14/3');
        expect(solution).toMatch(/text-emerald-800[^>]*data-result="percent-quantity">14\/3<\/span>/);
    });

    it('preserves a factor greater than one without reversing the intended part and whole', () => {
        const enlarged: PercentQuantityProblem = {...data, percent: 125,
            perHundred: {numerator: 125, denominator: 100}, scaleFactor: {numerator: 5, denominator: 4},
            whole: {numerator: 12, denominator: 5}, part: {numerator: 3, denominator: 1}};
        const question = renderToStaticMarkup(<PercentWholeInversionBody data={enlarged} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<PercentWholeInversionBody data={enlarged} isSolutionView={true} />);
        expect(text(question)).toContain('3 is 125% of what quantity?');
        expect(text(question)).toContain('125% = 125/100 = 5/4');
        expect(question).not.toContain('12/5');
        expect(text(solution)).toContain('3 ÷ (5/4) = 12/5');
    });
});
