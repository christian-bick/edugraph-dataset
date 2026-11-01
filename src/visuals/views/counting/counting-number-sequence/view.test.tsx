import {Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {CountingSequenceProblem} from '../../../../types/problems.ts';

let Core: typeof import('./view.tsx')['CountingNumberSequenceCore'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({CountingNumberSequenceCore: Core} = await import('./view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

function render(data: CountingSequenceProblem, isSolutionView: boolean,
    representation: Scope.PhysicalNumbers | Scope.ArabicNumerals = Scope.ArabicNumerals) {
    const payload: ViewRenderPayload<'counting-number-sequence'> = {
        problem: {type: 'counting', data, labels: []}, viewId: 'counting-number-sequence',
        targetLabels: [], isSolutionView, seed: 0
    };
    return renderToStaticMarkup(<Core config={{representation}} payload={payload} />);
}
const visibleNumerals = (markup: string) => [...markup.matchAll(/<span>(\d+)<\/span>/g)].map(match => Number(match[1]));

describe('counting sequence step instructions', () => {
    it('distinguishes identical two-cell question values counted by ones or tens and reveals their different answers', () => {
        const ones: CountingSequenceProblem = {sequence: [10, 11], stepSize: 1};
        const tens: CountingSequenceProblem = {sequence: [10, 20], stepSize: 10};
        const onesQuestion = render(ones, false), tensQuestion = render(tens, false);
        expect(visibleNumerals(onesQuestion)).toEqual([10]);
        expect(visibleNumerals(tensQuestion)).toEqual([10]);
        expect(onesQuestion).toContain('Count forward by ones.');
        expect(tensQuestion).toContain('Count forward by tens.');
        expect(onesQuestion).not.toBe(tensQuestion);
        expect(visibleNumerals(render(ones, true))).toEqual([10, 11]);
        expect(visibleNumerals(render(tens, true))).toEqual([10, 20]);
    });

    it.each([[1, 'ones'], [5, 'fives'], [10, 'tens'], [100, 'hundreds']] as const)(
        'states the supplied step of %s in both modes without revealing the question answer', (stepSize, name) => {
            const data = {sequence: [10, 10 + stepSize], stepSize};
            const question = render(data, false), solution = render(data, true);
            for (const markup of [question, solution]) expect(markup).toContain(`Count forward by ${name}.`);
            expect(question).toContain('Fill in the missing number.');
            expect(solution).not.toContain('Fill in the missing number.');
            expect(visibleNumerals(question)).toEqual([10]);
            expect(visibleNumerals(solution)).toEqual(data.sequence);
            expect(question).not.toContain('border-emerald-600');
            expect(solution).toContain('border-emerald-600');
        });

    it('preserves physical quantities and an interior blank with the same stated step', () => {
        const data: CountingSequenceProblem = {sequence: [1, 2, 3], stepSize: 1};
        const question = render(data, false, Scope.PhysicalNumbers), solution = render(data, true, Scope.PhysicalNumbers);
        expect(visibleNumerals(question)).toEqual([1, 3]);
        expect(visibleNumerals(solution)).toEqual(data.sequence);
        expect(question).toContain('Count forward by ones.');
        expect(question).not.toContain('aria-label="2 countable dots"');
        expect(solution).toContain('aria-label="2 countable dots"');
    });

    it('rejects an unsupported step before an instruction or answer can render', () => {
        expect(() => render({sequence: [10, 12], stepSize: 2} as unknown as CountingSequenceProblem, false))
            .toThrow('Step size must be 1, 5, 10, or 100.');
    });
});
