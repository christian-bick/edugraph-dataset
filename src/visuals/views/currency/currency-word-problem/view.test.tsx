import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {CurrencyAmount, CurrencyArithmeticProblem} from '../../../../types/problems.ts';

const {createRoot, render} = vi.hoisted(() => ({createRoot: vi.fn(), render: vi.fn()}));
vi.mock('react-dom/client', () => ({createRoot}));
let View: typeof import('./view.tsx')['CurrencyWordProblem'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    createRoot.mockReturnValue({render});
    ({CurrencyWordProblem: View} = await import('./view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

const coins = (denominationCents: number, count: number): CurrencyAmount => ({
    items: [{kind: 'coin', denominationCents, count}], totalCents: denominationCents * count
});
const mixed = (coinsCount: number): CurrencyAmount => ({
    items: [{kind: 'banknote', denominationCents: 100, count: 1},
        {kind: 'coin', denominationCents: 25, count: coinsCount}],
    totalCents: 100 + 25 * coinsCount
});
const notes = (count: number): CurrencyAmount => ({
    items: [{kind: 'banknote', denominationCents: 100, count}], totalCents: 100 * count
});
const fixtures: {name: string; data: CurrencyArithmeticProblem; answer: string; placeholder: string}[] = [
    {name: 'quarter addition crosses one dollar', data: {operation: 'addition', amounts: [coins(25, 3), coins(25, 2)], answerCents: 125}, answer: '$1.25', placeholder: '$?'},
    {name: 'dime addition crosses one dollar', data: {operation: 'addition', amounts: [coins(10, 5), coins(10, 6)], answerCents: 110}, answer: '$1.10', placeholder: '$?'},
    {name: 'coin answer remains below one dollar', data: {operation: 'addition', amounts: [coins(25, 2), coins(25, 1)], answerCents: 75}, answer: '75¢', placeholder: '?¢'},
    {name: 'coin answer is exactly one dollar', data: {operation: 'addition', amounts: [coins(25, 3), coins(25, 1)], answerCents: 100}, answer: '$1', placeholder: '$?'},
    {name: 'banknote context retains dollars below one dollar', data: {operation: 'subtraction', amounts: [mixed(2), mixed(1)], answerCents: 25}, answer: '$0.25', placeholder: '$?'},
    {name: 'whole-dollar subtraction retains its answer unit', data: {operation: 'subtraction', amounts: [notes(2), notes(1)], answerCents: 100}, answer: '$1', placeholder: '$?'}
];

const payload = (data: CurrencyArithmeticProblem, isSolutionView: boolean): ViewRenderPayload<'currency-word-problem'> => ({
    viewId: 'currency-word-problem', problem: {type: 'arithmetic', data, labels: []},
    targetLabels: [], seed: 17, isSolutionView,
    preparedView: {version: 1, viewId: 'currency-word-problem', planHash: 'currency-view-fixture',
        variantHash: 'empty-schema', config: {}, labels: [], randomState: 17}
});
const markup = (data: CurrencyArithmeticProblem, isSolutionView: boolean) =>
    renderToStaticMarkup(<View payload={payload(data, isSolutionView)} />);
const answerSlot = (html: string) => {
    const match = html.match(/<span class="flex min-w-\[92px\][^"]*">([^<]*)<\/span>/);
    if (!match) throw new Error('Currency answer slot must be present.');
    return match[1];
};
const withoutAnswer = (html: string) => html
    .replace(/border-emerald-500 bg-emerald-50 text-emerald-700|border-dashed border-slate-400 bg-white text-slate-400/g, 'answer-state')
    .replace(/(<span class="flex min-w-\[92px\][^"]*">)[^<]*(<\/span>)/, '$1answer$2');

describe('currency word-problem answer unit', () => {
    it.each(fixtures)('$name', ({data, answer, placeholder}) => {
        const question = markup(data, false), solution = markup(data, true);
        expect(answerSlot(question)).toBe(placeholder);
        expect(answerSlot(question)).not.toMatch(/\d/);
        expect(answerSlot(solution)).toBe(answer);
        expect(withoutAnswer(question)).toBe(withoutAnswer(solution));
        expect(question).toContain('border-dashed border-slate-400');
        expect(solution).toContain('border-emerald-500 bg-emerald-50');
        expect(markup(data, false)).toBe(question);
        expect(markup(data, true)).toBe(solution);
    });

    it('keeps a valid zero result unresolved with cent notation', () => {
        const data: CurrencyArithmeticProblem = {operation: 'subtraction', amounts: [coins(25, 1), coins(25, 1)], answerCents: 0};
        expect(answerSlot(markup(data, false))).toBe('?¢');
        expect(answerSlot(markup(data, true))).toBe('0¢');
    });

    it.each([
        {name: 'missing items', data: {...fixtures[0]!.data, amounts: [{items: [], totalCents: 75}, coins(25, 2)]}},
        {name: 'invalid currency kind', data: {...fixtures[0]!.data, amounts: [{items: [{kind: 'token', denominationCents: 25, count: 3}], totalCents: 75}, coins(25, 2)]}},
        {name: 'invalid denomination', data: {...fixtures[0]!.data, amounts: [coins(0, 3), coins(25, 2)]}},
        {name: 'invalid count', data: {...fixtures[0]!.data, amounts: [coins(25, 0), coins(25, 2)]}},
        {name: 'inconsistent represented total', data: {...fixtures[0]!.data, amounts: [{...coins(25, 3), totalCents: 76}, coins(25, 2)]}},
        {name: 'unsupported operation', data: {...fixtures[0]!.data, operation: 'multiplication'}},
        {name: 'wrong operand count', data: {...fixtures[0]!.data, amounts: [coins(25, 3)]}},
        {name: 'wrong answer', data: {...fixtures[0]!.data, answerCents: 126}},
        {name: 'negative result', data: {operation: 'subtraction', amounts: [coins(25, 1), coins(25, 2)], answerCents: -25}}
    ])('rejects $name before rendering an answer unit', ({data}) => {
        expect(() => markup(data as CurrencyArithmeticProblem, false)).toThrow();
    });

    it('registers and reuses the native render root without requiring a container', () => {
        const renderView = window.renderView;
        if (!renderView) throw new Error('Currency native entrypoint must be registered.');
        const getElementById = vi.fn().mockReturnValue(null);
        vi.stubGlobal('document', {getElementById});
        renderView(payload(fixtures[0]!.data, false));
        expect(createRoot).not.toHaveBeenCalled();
        const container = {};
        getElementById.mockReturnValue(container);
        renderView(payload(fixtures[0]!.data, false));
        renderView(payload(fixtures[0]!.data, true));
        expect(createRoot).toHaveBeenCalledExactlyOnceWith(container);
        expect(render).toHaveBeenCalledTimes(2);
    });
});
