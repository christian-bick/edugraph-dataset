import {createHash} from 'node:crypto';
import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {LegacyComparisonProblem} from '../../../../types/problems.ts';
import {getRandomState} from '../../../../lib/random.ts';

type Payload = ViewRenderPayload<'numbers-compare-counting'>;
let View: ComponentType<{payload: Payload}>;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    View = (await import('./view.tsx')).NumbersCompareCounting;
});
afterAll(() => vi.unstubAllGlobals());

const fixtures = [
    {data: {num1: 1, num2: 10, relation: 'less'}, seed: 642704194,
        prompt: 'Which group has fewer items?', answer: 'Group A',
        questionHash: '8b9b495c3e1e2ec10fcc3cf270593d85a3a3aa2ec66629bcd4a20314cc7a7222'},
    {data: {num1: 10, num2: 1, relation: 'greater'}, seed: 19,
        prompt: 'Which group has more items?', answer: 'Group A',
        questionHash: '25efd376b4f258ca5e4fd52c496227746b5e7283f2463a6e600343b24228a565'},
    {data: {num1: 4, num2: 4, relation: 'equal'}, seed: 27,
        prompt: 'Which group has more items?', answer: 'They are equal',
        questionHash: '8cc71f243525011af9b9523b97f77cbe47eabe0c0093e484b28ae5bd63b9665f'}
] as const;

const render = (data: LegacyComparisonProblem, seed: number, solution: boolean) => {
    const payload: Payload = {viewId: 'numbers-compare-counting', targetLabels: [],
        problem: {type: 'comparison', data, labels: []}, seed, isSolutionView: solution,
        preparedView: {version: 1, viewId: 'numbers-compare-counting', planHash: 'plan', variantHash: 'variant',
            labels: [], config: {}, randomState: 17}};
    return renderToStaticMarkup(createElement(View, {payload}));
};
const selected = (markup: string) => [...markup.matchAll(/<div class="([^"]+)">([^<]*)<\/div>/g)]
    .filter(([, classes]) => classes.includes('border-green-600')).map(([, , text]) => text);

describe('counting comparison task context', () => {
    it.each(fixtures)('preserves the requested relation in both modes for $data.relation', ({data, seed, prompt, answer}) => {
        const question = render(data, seed, false);
        const solution = render(data, seed, true);
        expect(question).toContain(prompt);
        expect(solution).toContain(prompt);
        expect(selected(question)).toEqual([]);
        expect(selected(solution)).toEqual([answer]);
        for (const markup of [question, solution]) {
            expect(markup.match(/alt="Group A object"/g)).toHaveLength(data.num1);
            expect(markup.match(/alt="Group B object"/g)).toHaveLength(data.num2);
        }
    });

    // Captured from the original Question projection before restoring Solution context.
    it.each(fixtures)('keeps Question markup byte-identical for $data.relation', ({data, seed, questionHash}) => {
        expect(createHash('sha256').update(render(data, seed, false)).digest('hex')).toBe(questionHash);
    });

    it('preserves the canonical counts, seeded icons and prepared entropy continuation', () => {
        const data = Object.freeze({num1: 1, num2: 10, relation: 'less' as const});
        const first = render(data, 642704194, true);
        expect(render(data, 642704194, true)).toBe(first);
        expect(first).toContain('/icons/counting/triangle.svg');
        expect(first).toContain('/icons/counting/hexagon.svg');
        expect(data).toEqual({num1: 1, num2: 10, relation: 'less'});
        expect(getRandomState()).toBe(17);
    });
});
