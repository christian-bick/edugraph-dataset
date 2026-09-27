import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {CountingSmallOffsetProblem} from '../../../../types/problems.ts';
import {CountingIncDecCore} from './view.tsx';

function problem(
    start: number, stepSize: 1 | 10, incDecType: 'inc' | 'dec'
): CountingSmallOffsetProblem {
    const answer = incDecType === 'inc' ? start + stepSize : start - stepSize;
    const parts = (value: number) => ({tens: Math.floor(value / 10), ones: value % 10});
    return {
        numObjects: start, simpleAnswer: start, incDecType, incDecAnswer: answer, stepSize,
        startPlaceValue: parts(start), resultPlaceValue: parts(answer)
    };
}

function render(data: CountingSmallOffsetProblem, isSolutionView: boolean, seed = 17): string {
    const payload: ViewRenderPayload<'counting-inc-dec'> = {
        problem: {type: 'counting', data, labels: []}, viewId: 'counting-inc-dec',
        targetLabels: [], isSolutionView, seed
    };
    return renderToStaticMarkup(<CountingIncDecCore config={{}} payload={payload} />);
}

function visiblePositions(markup: string) {
    return [...markup.matchAll(/data-sequence-position="(start|result)"[^>]*>([^<]*)<\/div>/g)]
        .map(([, role, value]) => ({role, value}));
}

describe('counting-inc-dec sequence projection', () => {
    it.each([
        [7, 1, 'inc'], [8, 1, 'dec'], [6, 10, 'inc'], [16, 10, 'dec']
    ] as const)('shows the %s %s %s change as ordered positions without revealing the question answer', (start, step, direction) => {
        const data = problem(start, step, direction);
        const question = render(data, false);
        const solution = render(data, true);
        const startPosition = {role: 'start', value: String(start)};
        const blankResult = {role: 'result', value: ''};
        const solvedResult = {role: 'result', value: String(data.incDecAnswer)};
        const isInc = direction === 'inc';

        expect(visiblePositions(question)).toEqual(isInc
            ? [startPosition, blankResult] : [blankResult, startPosition]);
        expect(visiblePositions(solution)).toEqual(isInc
            ? [startPosition, solvedResult] : [solvedResult, startPosition]);
        expect(question).toContain(isInc ? 'After' : 'Before');
        expect(question).toContain('Write the missing number.');
        expect(solution).not.toContain('Write the missing number.');

        for (const markup of [question, solution]) {
            expect(markup).toContain('Counting sequence');
            expect(markup).toContain(`data-signed-step="true">${isInc ? '+' : '−'}${step}</span>`);
            expect(markup).toContain(`data-step-direction="${isInc ? 'right' : 'left'}"`);
            expect(markup).toContain(isInc ? '→' : '←');
            expect(markup.match(/data-counting-object="true"/g)).toHaveLength(start);
            expect(markup.match(/data-removed-object="true"/g) ?? []).toHaveLength(isInc ? 0 : step);
        }
    });

    it.each([
        [19, 1, 'inc'], [2, 1, 'dec'], [10, 10, 'inc'], [20, 10, 'dec']
    ] as const)('renders supported boundary quantities %s %s %s', (start, step, direction) => {
        const data = problem(start, step, direction);
        const result = visiblePositions(render(data, true)).find(position => position.role === 'result');
        expect(result?.value).toBe(String(data.incDecAnswer));
    });

    it('uses only the supplied render seed for object presentation', () => {
        const data = problem(7, 1, 'inc');
        expect(render(data, false, 17)).toEqual(render(data, false, 17));
        expect(render(data, false, 18)).not.toEqual(render(data, false, 17));
        expect(visiblePositions(render(data, true, 18))).toEqual(visiblePositions(render(data, true, 17)));
    });

    it('rejects missing or inconsistent mathematical evidence before rendering', () => {
        const data = problem(7, 1, 'inc');
        expect(() => render({...data, incDecAnswer: 9}, true)).toThrow('consistent ±1 or ±10');
        expect(() => render({...data, stepSize: undefined} as unknown as CountingSmallOffsetProblem, false))
            .toThrow('stepSize');
        expect(() => render(problem(20, 1, 'inc'), false)).toThrow('consistent ±1 or ±10');
    });
});
