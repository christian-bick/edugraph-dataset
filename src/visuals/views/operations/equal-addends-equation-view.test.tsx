import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {ArithmeticPairProblem} from '../../../types/problems.ts';
import {EqualAddendsEquation, validateEqualAddendsEquation} from './equal-addends-equation-view.tsx';

const pair = (addend: number): ArithmeticPairProblem =>
    ({num1: addend, num2: addend, operation: 'addition', answer: addend * 2});

describe('equal-addends equation formalization', () => {
    it.each([-6, 0, 1, 4, 6, 10, 500000])('asks for the whole equation for addend %s', addend => {
        const data = pair(addend);
        const question = renderToStaticMarkup(<EqualAddendsEquation data={data} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<EqualAddendsEquation data={data} isSolutionView />);
        for (const markup of [question, solution]) {
            expect(markup).toContain(`>${data.answer}</span>`);
            expect(markup).toContain('Write an addition equation expressing this number as two equal addends.');
            expect(markup).not.toMatch(/NaN|undefined|Rendering Error/);
        }
        expect(question).toContain('aria-label="Write your equation"');
        expect(question).not.toContain(`${addend} + ${addend}`);
        expect(question.replace(/<[^>]*>/g, '')).not.toContain('=');
        expect(solution).toContain(`${addend} + ${addend} = ${data.answer}`);
        expect(solution).toContain('aria-label="Equal-addends equation"');
    });

    it.each([
        null, {}, {...pair(6), num1: undefined}, {...pair(6), operation: 'multiplication'},
        {...pair(6), num2: 5}, {...pair(6), answer: 11}, {...pair(6), answer: 14},
        {...pair(6), num1: 0.5, num2: 0.5, answer: 1}, {...pair(6), num1: Infinity},
        {...pair(6), num3: 1}, {...pair(6), num4: 1}, {...pair(6), propertyLaw: 'commutative'}
    ])('rejects missing, contradictory or wrong-family evidence %#', data => {
        for (const isSolutionView of [false, true]) {
            expect(() => renderToStaticMarkup(<EqualAddendsEquation data={data as never} isSolutionView={isSolutionView} />))
                .toThrow(/Validation Error/);
        }
    });

    it('accepts the complete pair shape without mutating canonical data', () => {
        const data = Object.freeze({...pair(6), num3: undefined, propertyLaw: undefined});
        expect(() => validateEqualAddendsEquation(data)).not.toThrow();
        expect(data).toEqual({...pair(6), num3: undefined, propertyLaw: undefined});
    });
});
