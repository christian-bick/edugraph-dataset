import {createHash} from 'node:crypto';
import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {getRandomState} from '../../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {MeasurementCompareProblem} from '../../../../types/problems.ts';

type Payload = ViewRenderPayload<'measure-compare'>;
let View: ComponentType<{payload: Payload}>;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    View = (await import('./view.tsx')).MeasureCompare;
});
afterAll(() => vi.unstubAllGlobals());

const fixtures = [
    {data: {attribute: 'length', relation: 'greater', magnitudes: {smaller: 3, larger: 6}},
        seed: 530662365, prompt: 'Which ribbon is longer?', answer: 'Ribbon A',
        questionHash: '0a08b20b3c9ad01ad2c410b3187d209a609449b2893ac7309c5b225d2cf95d1c'},
    {data: {attribute: 'length', relation: 'less', magnitudes: {smaller: 3, larger: 8}},
        seed: 0, prompt: 'Which ribbon is shorter?', answer: 'Ribbon A',
        questionHash: 'c9ee18ccba6b4f897ffcd56c408d3bf4f2998aadc3ecf1ff0736099cf46d2709'},
    {data: {attribute: 'weight', relation: 'greater', magnitudes: {smaller: 3, larger: 8}},
        seed: 0, prompt: 'Which item is heavier?', answer: 'Item B',
        questionHash: 'f976ac3419a4f1532caa2752b01edbc0b315ca3758f71bc5d8dc5163a29dfbe6'},
    {data: {attribute: 'weight', relation: 'less', magnitudes: {smaller: 3, larger: 8}},
        seed: 1, prompt: 'Which item is lighter?', answer: 'Item B',
        questionHash: 'f1752efcaec116685a499c558992b4decb554abcd0c53f77dc00e371f76ac1b7'}
] as const;

const render = (data: MeasurementCompareProblem, seed: number, solution: boolean) => {
    const payload: Payload = {viewId: 'measure-compare', targetLabels: [],
        problem: {type: 'measurement', data, labels: []}, seed, isSolutionView: solution,
        preparedView: {version: 1, viewId: 'measure-compare', planHash: 'plan', variantHash: 'variant',
            labels: [], config: {}, randomState: 17}};
    return renderToStaticMarkup(createElement(View, {payload}));
};
const selected = (markup: string) => [...markup.matchAll(/<div class="([^"]+)">([^<]*)<\/div>/g)]
    .filter(([, classes]) => classes.includes('border-green-600')).map(([, , text]) => text);

describe('measurement comparison task context', () => {
    it.each(fixtures)('preserves $data.attribute/$data.relation context in both modes', ({data, seed, prompt, answer}) => {
        const question = render(data, seed, false);
        const solution = render(data, seed, true);
        expect(question).toContain(prompt);
        expect(solution).toContain(prompt);
        expect(selected(question)).toEqual([]);
        expect(selected(solution)).toEqual([answer]);
    });

    // Captured from the original Question projection before restoring Solution context.
    it.each(fixtures)('keeps Question markup byte-identical for $data.attribute/$data.relation', ({data, seed, questionHash}) => {
        expect(createHash('sha256').update(render(data, seed, false)).digest('hex')).toBe(questionHash);
    });

    it('preserves the replayed magnitudes, seeded placement and prepared entropy continuation', () => {
        const data = Object.freeze({attribute: 'length' as const, relation: 'greater' as const,
            magnitudes: Object.freeze({smaller: 3, larger: 6})});
        const first = render(data, 530662365, true);
        expect(render(data, 530662365, true)).toBe(first);
        expect(first).toContain('width:150px');
        expect(first).toContain('width:75px');
        expect(selected(first)).toEqual(['Ribbon A']);
        expect(data).toEqual({attribute: 'length', relation: 'greater', magnitudes: {smaller: 3, larger: 6}});
        expect(getRandomState()).toBe(17);
    });
});
