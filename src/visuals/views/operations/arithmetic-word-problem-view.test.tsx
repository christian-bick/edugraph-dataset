import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {ArithmeticPairProblem, ArithmeticTripleProblem} from '../../../types/problems.ts';
import {ArithmeticWordProblemView} from './arithmetic-word-problem-view.tsx';

const render = (data: ArithmeticPairProblem | ArithmeticTripleProblem, invertProcedure: boolean, isSolutionView: boolean) => {
    const payload: ViewRenderPayload<'operations-word-problem' | 'operations-word-problem-inversion'> = {
        problem: {type: 'arithmetic', data, labels: []},
        viewId: invertProcedure ? 'operations-word-problem-inversion' : 'operations-word-problem',
        targetLabels: [], isSolutionView, seed: 17
    };
    return renderToStaticMarkup(<ArithmeticWordProblemView payload={payload} invertProcedure={invertProcedure} />);
};
const card = (markup: string, part: string) => markup.match(new RegExp(`<section[^>]*data-quantity="${part}"[\\s\\S]*?</section>`))![0];
const units = (markup: string, unit: string) => [...markup.matchAll(new RegExp(`data-unit="${unit}"`, 'g'))].length;

describe('word-problem quantity pictures', () => {
    it('shows one apple and one friend for 1÷1, with the share hidden in Question mode', () => {
        const data: ArithmeticPairProblem = {num1: 1, num2: 1, answer: 1, operation: 'division'};
        const question = render(data, false, false), solution = render(data, false, true);
        expect(units(card(question, 'num1'), 'apple')).toBe(1);
        expect(units(card(question, 'num2'), 'friend')).toBe(1);
        expect(units(card(question, 'num2'), 'apple')).toBe(0);
        expect(card(question, 'answer')).toContain('Apples per friend: unknown');
        expect(units(card(question, 'answer'), 'apple')).toBe(0);
        expect(card(question, 'answer')).toContain('?');
        expect(units(card(solution, 'answer'), 'apple')).toBe(1);
    });

    it('separates a group count from apples per group in multiplication inversion', () => {
        const data: ArithmeticPairProblem = {num1: 1, num2: 2, answer: 2, operation: 'multiplication'};
        const question = render(data, true, false), solution = render(data, true, true);
        expect(units(card(question, 'num1'), 'group')).toBe(1);
        expect(units(card(question, 'num1'), 'apple')).toBe(0);
        expect(card(question, 'num2')).toContain('Apples per group: unknown');
        expect(units(card(question, 'num2'), 'apple')).toBe(0);
        expect(units(card(question, 'answer'), 'apple')).toBe(2);
        expect(units(card(solution, 'num2'), 'apple')).toBe(2);
    });

    it('reserves enough result space in both modes when valid small operands have a larger product', () => {
        const data: ArithmeticPairProblem = {num1: 20, num2: 20, answer: 400, operation: 'multiplication'};
        const question = card(render(data, false, false), 'answer');
        const solution = card(render(data, false, true), 'answer');
        expect(question).toContain('min-height:1576px');
        expect(solution).toContain('min-height:1576px');
        expect(units(question, 'apple')).toBe(0);
        expect(units(solution, 'apple')).toBe(400);
    });

    const problems: ArithmeticPairProblem[] = [
        {num1: 3, num2: 5, answer: 8, operation: 'addition'},
        {num1: 9, num2: 4, answer: 5, operation: 'subtraction'},
        {num1: 3, num2: 4, answer: 12, operation: 'multiplication'},
        {num1: 12, num2: 3, answer: 4, operation: 'division'}
    ];
    it.each(problems)('$operation preserves every given quantity and restores only its unknown picture', data => {
        for (const invertProcedure of [false, true]) {
            const unknown = invertProcedure ? 'num2' : 'answer';
            setSeed(940);
            const before = getRandomState();
            const question = render(data, invertProcedure, false), solution = render(data, invertProcedure, true);
            expect(getRandomState()).toBe(before);
            expect(question.match(/<section /g)).toHaveLength(3);
            expect(solution.match(/<section /g)).toHaveLength(3);
            for (const part of ['num1', 'num2', 'answer'] as const) {
                expect(card(solution, part)).toContain(`: ${data[part]}`);
                if (part === unknown) {
                    expect(card(question, part)).toContain(': unknown');
                    expect(card(question, part)).not.toContain('data-unit=');
                } else expect(card(question, part)).toContain(`: ${data[part]}`);
            }
        }
    });

    it.each([
        {num1: 3, num2: 5, num3: 7, answer: 15, operation: 'addition'},
        {num1: 12, num2: 3, num3: 2, answer: 7, operation: 'subtraction'},
        {num1: 2, num2: 3, num3: 2, answer: 12, operation: 'multiplication'},
        {num1: 12, num2: 2, num3: 3, answer: 2, operation: 'division'}
    ] satisfies ArithmeticTripleProblem[])('retains all triple $operation quantity roles', data => {
        const solution = render(data, false, true);
        expect(solution.match(/<section /g)).toHaveLength(4);
        for (const part of ['num1', 'num2', 'num3', 'answer'] as const) expect(card(solution, part)).toContain(`: ${data[part]}`);
    });
});
