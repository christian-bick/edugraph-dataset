import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {ArithmeticTripleProblem} from '../../../types/problems.ts';
import {ArithmeticBoxesView} from './arithmetic-boxes-view.tsx';
import {arithmeticLawEquations, ArithmeticLawExercise} from './arithmetic-law-view.tsx';
import {ArithmeticVerticalView} from './arithmetic-vertical-view.tsx';
import {ArithmeticWordProblemView} from './arithmetic-word-problem-view.tsx';

const distributive: ArithmeticTripleProblem = {
    operation: 'multiplication',
    num1: 7,
    num2: 13,
    num3: 1,
    combinedFactor: 14,
    partialProducts: [91, 7],
    answer: 98,
    propertyLaw: 'distributive'
};

const commutative: ArithmeticTripleProblem = {
    operation: 'addition',
    num1: 2,
    num2: 3,
    num3: 4,
    answer: 9,
    propertyLaw: 'commutative'
};

const associative: ArithmeticTripleProblem = {
    operation: 'addition',
    num1: 2,
    num2: 3,
    num3: 4,
    answer: 9,
    propertyLaw: 'associative'
};

const payload = (data: ArithmeticTripleProblem, isSolutionView = false) => ({
    problem: {type: 'arithmetic', data},
    viewId: 'operations-boxes-inversion',
    labels: [],
    isSolutionView,
    seed: 5
}) as ViewRenderPayload<'operations-boxes-inversion'>;

describe('arithmetic law rendering', () => {
    it('preserves the full distributive structure and carries the unknown through partial products', () => {
        expect(arithmeticLawEquations(distributive, 'num2', false)).toEqual({
            primary: '7 × (□ + 1) = 98',
            witness: '7 × □ + 7 × 1 = □ + 7 = 98'
        });
        expect(arithmeticLawEquations(distributive, 'num2', true)).toEqual({
            primary: '7 × (13 + 1) = 98',
            witness: '7 × 13 + 7 × 1 = 91 + 7 = 98'
        });
    });

    it.each([
        [commutative, '3 + 2 + 4 = 9'],
        [associative, '2 + (3 + 4) = 9']
    ] as const)('renders the $propertyLaw witness explicitly', (data, witness) => {
        const markup = renderToStaticMarkup(
            <ArithmeticLawExercise data={data} unknown="answer" isSolutionView />
        );
        expect(markup).toContain(witness);
        expect(markup).toContain('property');
        expect(markup).toContain('The missing value is');
    });

    it('routes boxes, vertical, and word-problem inversion through the shared law renderer', () => {
        const boxes = renderToStaticMarkup(
            <ArithmeticBoxesView invertProcedure payload={payload(distributive)} />
        );
        const vertical = renderToStaticMarkup(
            <ArithmeticVerticalView invertProcedure payload={payload(distributive) as never} />
        );
        const word = renderToStaticMarkup(
            <ArithmeticWordProblemView invertProcedure payload={payload(distributive) as never} />
        );

        for (const markup of [boxes, vertical, word]) {
            expect(markup).toContain('Distributive property');
            expect(markup).toMatch(/7 × \((?:□ \+ 1|13 \+ □)\) = 98/);
            expect(markup).toMatch(/7 × (?:□ \+ 7 × 1|13 \+ 7 × □)/);
            expect(markup).not.toContain('7 × 13 × 1 = 98');
        }
        expect(word).toContain('Each row is split into');
    });

    it('rejects contradictory distributive evidence', () => {
        expect(() => arithmeticLawEquations({...distributive, answer: 91}, 'num2', false))
            .toThrow('must preserve the sum');
    });
});
