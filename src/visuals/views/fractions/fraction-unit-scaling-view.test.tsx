import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {ProperFractionUnitScalingProblem} from '../../../types/problems.ts';
import {FractionUnitScalingBody, isValidUnitScalingProblem} from './fraction-unit-scaling-view.tsx';

const example: ProperFractionUnitScalingProblem = {
    task: 'relate-equivalent-fractions',
    first: {numerator: 1, denominator: 2},
    second: {numerator: 2, denominator: 4},
    scaleFactor: 2,
    unitMultiplier: {numerator: 2, denominator: 2, value: 1},
    relation: 'equal'
};

describe('fraction unit scaling view', () => {
    it('keeps the equation and aligned whole models visible while withholding only the explanation', () => {
        const question = renderToStaticMarkup(<FractionUnitScalingBody data={example} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<FractionUnitScalingBody data={example} isSolutionView={true} />);

        for (const markup of [question, solution]) {
            expect(markup).toContain('Both bars represent the same whole.');
            expect(markup).toContain('1 of 2 equal parts shaded');
            expect(markup).toContain('2 of 4 equal parts shaded');
            expect(markup).toContain('repeat(2, minmax(0, 1fr))');
            expect(markup).toContain('repeat(4, minmax(0, 1fr))');
            expect(markup).toContain('and');
            expect(markup).toContain('= 1');
        }
        expect(question).toContain('Explain why multiplying');
        expect(question).not.toContain('Each original part becomes');
        expect(solution).toContain('Each original part becomes 2 equal smaller parts');
    });

    it('rejects an inconsistent unit multiplier or partition', () => {
        expect(isValidUnitScalingProblem(example)).toBe(true);
        expect(isValidUnitScalingProblem({
            ...example,
            unitMultiplier: {numerator: 3, denominator: 3, value: 1}
        })).toBe(false);
        expect(isValidUnitScalingProblem({
            ...example,
            second: {numerator: 3, denominator: 4}
        })).toBe(false);
    });
});
