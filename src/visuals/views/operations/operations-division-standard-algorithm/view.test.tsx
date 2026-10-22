import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {StandardDivisionProblem} from '../../../../types/problems.ts';
import {buildStandardDivisionProblem} from '../../../../generators/arithmetic/standard-algorithm-division/generator.ts';
import {divisionCases} from './fixtures.ts';

let Core: typeof import('./view.tsx').OperationsDivisionStandardAlgorithmCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Core = (await import('./view.tsx')).OperationsDivisionStandardAlgorithmCore;
});
afterAll(() => vi.unstubAllGlobals());

function render(data: StandardDivisionProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'operations-division-standard-algorithm'> = {
        problem: {type: 'arithmetic', data, labels: []}, viewId: 'operations-division-standard-algorithm',
        targetLabels: [], isSolutionView, seed: 13
    };
    return renderToStaticMarkup(<Core config={{}} payload={payload} />);
}
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('standard long-division task projection', () => {
    it('withholds all computed columns and solution styling in Question', () => {
        for (const data of Object.values(divisionCases)) {
            const question = render(data, false);
            expect(question).toContain('data-role="given-operands"');
            expect(question).toContain('data-role="blank-work"');
            expect(question).toContain('Quotient: ___');
            expect(question).toContain('Remainder: ___');
            expect(question).not.toContain('division-step');
            expect(question).not.toContain('data-end-column');
            expect(question).not.toContain('Bring down');
            expect(question).not.toContain('emerald');
            expect(question).not.toContain('×');
        }
        const question = render(divisionCases.remainder, false);
        expect(question).toContain('Divide 82,417 ÷ 321.');
        expect(question).not.toContain('256');
        expect(question).not.toContain('241');
    });

    it('preserves the internal zero multiplication and every brought-down digit in Solution', () => {
        const solution = render(divisionCases.internalZero, true);
        const text = visible(solution);
        expect(solution.match(/data-role="division-step"/g)).toHaveLength(3);
        expect(solution.match(/data-role="subtraction-rule"/g)).toHaveLength(3);
        expect(text).toContain('125 × 0');
        expect(text).toContain('Bring down 2');
        expect(text).toContain('Bring down 5');
        expect(solution).toContain('Bring down original dividend digit 2 in column 4');
        expect(solution).toContain('Bring down original dividend digit 5 in column 5');
        expect(text).toContain('Quotient: 101');
        expect(text).toContain('Remainder: 0');
        expect(text).toContain('12,625 = 125 × 101 + 0');
        expect(solution).not.toContain('blank-work');
        expect(solution).not.toContain('___');
    });

    it('retains successive zero quotient places and a trailing zero before a nonzero remainder', () => {
        const successive = render(divisionCases.successiveZeros, true);
        expect(successive.match(/data-role="division-step"/g)).toHaveLength(4);
        expect(visible(successive).match(/12 × 0/g)).toHaveLength(2);
        expect(visible(successive)).toContain('Quotient: 1,001');
        const trailing = render(divisionCases.trailingZero, true);
        expect(trailing.match(/data-role="division-step"/g)).toHaveLength(2);
        expect(visible(trailing)).toContain('125 × 0');
        expect(visible(trailing)).toContain('Quotient: 80');
        expect(visible(trailing)).toContain('Remainder: 50');
        expect(trailing).toContain('data-role="final-remainder" data-end-column="4"');
    });

    it('renders quotient zero and a three-digit final remainder without invented leading quotient zeros', () => {
        const zero = render(divisionCases.quotientZero, true);
        expect(zero.match(/data-role="division-step"/g)).toHaveLength(1);
        expect(visible(zero)).toContain('456 × 0');
        expect(visible(zero)).toContain('Quotient: 0');
        expect(visible(zero)).toContain('Remainder: 123');
        expect(zero).not.toContain('Bring down');
        const remainder = render(divisionCases.remainder, true);
        expect(visible(remainder)).toContain('321 × 2');
        expect(visible(remainder)).toContain('321 × 5');
        expect(visible(remainder)).toContain('321 × 6');
        expect(visible(remainder)).toContain('82,417 = 321 × 256 + 241');
    });

    it('projects optional metadata faithfully and also renders valid witnesses without it', () => {
        const data = divisionCases.internalZero;
        const steps = data.steps.map(({nextBringDown: _, ...step}) => step);
        expect(render({...data, steps}, true)).toBe(render(data, true));
        const corrupted = {...data, steps: data.steps.map((step, index) => index === 0
            ? {...step, nextBringDown: {...step.nextBringDown!, digit: 9}} : step)};
        expect(() => render(corrupted, false)).toThrow('inconsistent');
    });

    it('renders safe-integer boundary members without imposing the generator’s local digit cap', () => {
        for (const [dividend, divisor] of [[Number.MAX_SAFE_INTEGER, 1],
            [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER], [10, Number.MAX_SAFE_INTEGER]]) {
            const data = buildStandardDivisionProblem(dividend!, divisor!);
            const solution = render(data, true);
            expect(solution.match(/data-role="division-step"/g)).toHaveLength(data.steps.length);
            expect(solution).not.toMatch(/NaN|undefined|null/);
            expect(render(data, false)).not.toContain('division-step');
        }
    });
});
