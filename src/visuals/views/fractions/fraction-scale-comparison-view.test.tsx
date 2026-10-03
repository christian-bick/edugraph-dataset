import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {FractionScaleComparisonProblem} from '../../../types/problems.ts';
import {isValidFractionScaleComparison} from './fraction-scale-comparison-helpers.ts';
import {FractionScaleComparisonBody} from './fraction-scale-comparison-view.tsx';

const caseFor = (numerator: number, denominator: number,
    relation: FractionScaleComparisonProblem['relation']): FractionScaleComparisonProblem => ({
    kind: 'fraction-scale-comparison',
    reference: {numerator: 4, denominator: 1},
    scaleFactor: {numerator, denominator},
    product: {numerator: 4 * numerator, denominator},
    relation,
    onePart: {numerator: 4, denominator},
    partDifferenceCount: numerator - denominator,
    wholeNumberAnalogy: {factor: 2, product: {numerator: 8, denominator: 1}}
});

describe('fraction scaling comparison views', () => {
    it.each([
        [5, 3, 'greater'], [2, 3, 'less'], [3, 3, 'equal']
    ] as const)('accepts the %i/%i %s witness and shows its relation only in Solution Mode', (a, b, relation) => {
        const data = caseFor(a, b, relation);
        expect(isValidFractionScaleComparison(data)).toBe(true);
        const question = renderToStaticMarkup(<FractionScaleComparisonBody data={data}
            task="comparison" isSolutionView={false} />);
        const solution = renderToStaticMarkup(<FractionScaleComparisonBody data={data}
            task="comparison" isSolutionView={true} />);
        expect(question).toContain('Choose &gt;, &lt;, or =');
        expect(question).toContain(`${a}/${b}`);
        expect(question).not.toContain(`>${4 * a}/${b}<`);
        expect(question).not.toContain('Every section is one equal part');
        expect(solution).not.toContain(`${4 * a}/${b}`);
        expect(solution).toContain(`4 × ${a}/${b}`);
        expect(solution).toContain('Every section is one equal part');
    });

    it('keeps the fraction verdict open in the explanation question while showing the whole-number example', () => {
        const data = caseFor(2, 3, 'less');
        const question = renderToStaticMarkup(<FractionScaleComparisonBody data={data}
            task="explanation" isSolutionView={false} />);
        const solution = renderToStaticMarkup(<FractionScaleComparisonBody data={data}
            task="explanation" isSolutionView={true} />);
        expect(question).toContain('multiplying 4 by 2 gives 8');
        expect(question).not.toContain('8/3');
        expect(question).not.toContain('2 &lt; 3');
        expect(solution).toContain('2 &lt; 3');
        expect(solution).not.toContain('8/3');
    });

    it('rejects inconsistent exact mathematics and sign claims', () => {
        const data = caseFor(5, 3, 'greater');
        expect(isValidFractionScaleComparison({...data, relation: 'less'})).toBe(false);
        expect(isValidFractionScaleComparison({...data, onePart: {numerator: 2, denominator: 3}})).toBe(false);
        expect(isValidFractionScaleComparison({...data, product: {numerator: 19, denominator: 3}})).toBe(false);
        expect(isValidFractionScaleComparison({...data, scaleFactor: {numerator: 1_000_000, denominator: 3}})).toBe(false);
    });
});
