import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {getRandomState} from '../../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {ArithmeticWordProblemRounding} from '../../../../types/problems.ts';

let View: typeof import('./view.tsx').OperationsWordProblemReasoning;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    View = (await import('./view.tsx')).OperationsWordProblemReasoning;
});
afterAll(() => vi.unstubAllGlobals());

const original: ArithmeticWordProblemRounding = {
    kind: 'rounding', numberDomain: {min: 1, max: 100}, operands: [23, 32, 45],
    operations: ['addition', 'addition'], intermediate: 55, answer: 100,
    roundingPlace: 100, roundedAnswer: 100,
    proposal: {proposedAnswer: 99, roundedProposedAnswer: 100}
};
const payload = (data: ArithmeticWordProblemRounding, isSolutionView: boolean, seed = 1):
    ViewRenderPayload<'operations-word-problem-reasoning'> => ({
        viewId: 'operations-word-problem-reasoning', problem: {type: 'arithmetic', data, labels: []},
        targetLabels: [], seed, isSolutionView,
        preparedView: {version: 1, viewId: 'operations-word-problem-reasoning', planHash: 'reasoning-domain',
            variantHash: 'reasoning-domain', config: {}, labels: [], randomState: 417}
    });
const render = (data: ArithmeticWordProblemRounding, solution: boolean, seed = 1) =>
    renderToStaticMarkup(<View payload={payload(data, solution, seed)} />);
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('canonical word-problem reasonableness projection', () => {
    it('preserves the original 100-boundary story while withholding the verdict in Question', () => {
        const question = text(render(original, false));
        const solution = text(render(original, true));
        expect(question).toContain('A student says the final result is 99.');
        expect(question).toContain('100 rounds to 100; 99 rounds to 100.');
        expect(question).toContain('Verdict: __________');
        expect(question).not.toContain('99 is a reasonable answer.');
        expect(solution).toContain('23 + 32 = 55');
        expect(solution).toContain('55 + 45 = 100');
        expect(solution).toContain('99 is a reasonable answer.');
        expect(question).not.toContain('200');
        expect(solution).not.toContain('200');
    });

    it('evaluates an unreasonable canonical proposal without sampling a replacement', () => {
        const data = {...original, numberDomain: {min: 1, max: 1000},
            proposal: {proposedAnswer: 200, roundedProposedAnswer: 200}};
        expect(text(render(data, false))).toContain('A student says the final result is 200.');
        expect(text(render(data, true))).toContain('200 is not a reasonable answer.');
    });

    it('keeps the proposal independent of presentation seed and consumes no display entropy', () => {
        for (const solution of [false, true]) {
            expect(render(original, solution, 1)).toBe(render(original, solution, 2));
            expect(render(original, solution, 0xffffffff)).toBe(render(original, solution, 2));
            expect(getRandomState()).toBe(417);
        }
    });

    it.each([
        [{proposal: undefined}, 'Required field "proposal"'],
        [{numberDomain: undefined}, 'Required field "numberDomain"'],
        [{proposal: {proposedAnswer: 200, roundedProposedAnswer: 200}}, 'canonical bounded proposal'],
        [{proposal: {proposedAnswer: 99, roundedProposedAnswer: 0}}, 'canonical bounded proposal'],
        [{intermediate: 56}, 'result-rounding relation']
    ])('rejects stale or invalid evidence %j in either mode', (change, message) => {
        for (const solution of [false, true]) {
            expect(() => render({...original, ...change} as ArithmeticWordProblemRounding, solution)).toThrow(message);
        }
    });
});
