import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {PlaceValueHundredsBundlesProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {PlaceValueHundredsBundlesCore} from './place-value-hundreds-bundles/view.tsx';
import {PlaceValueHundredsBundlesExplanationCore} from './place-value-hundreds-bundles-explanation/view.tsx';

type Task = 'completion' | 'explanation';
const tasks = ['completion', 'explanation'] as const;
const cases: PlaceValueHundredsBundlesProblem[] = [
    {hundreds: 1, tens: 10, ones: 0, target: 100},
    ...Array.from({length: 9}, (_, index): PlaceValueHundredsBundlesProblem => ({
        hundreds: index + 1, tens: 0, ones: 0, target: (index + 1) * 100
    }))
];

function render(data: PlaceValueHundredsBundlesProblem, task: Task, isSolutionView: boolean, seed = 17): string {
    const common = {problem: {type: 'arithmetic' as const, data, labels: []}, targetLabels: [], isSolutionView, seed};
    if (task === 'completion') {
        const payload: ViewRenderPayload<'place-value-hundreds-bundles'> = {...common, viewId: 'place-value-hundreds-bundles'};
        return renderToStaticMarkup(<PlaceValueHundredsBundlesCore config={{}} payload={payload} />);
    }
    const payload: ViewRenderPayload<'place-value-hundreds-bundles-explanation'> = {
        ...common, viewId: 'place-value-hundreds-bundles-explanation'
    };
    return renderToStaticMarkup(<PlaceValueHundredsBundlesExplanationCore config={{}} payload={payload} />);
}

function answer(markup: string): string | undefined {
    return markup.match(/aria-label="represented number"[^>]*>([^<]*)<\/span>/)?.[1];
}

function occurrences(markup: string, text: string): number {
    return markup.split(text).length - 1;
}

describe('hundreds bundle projections', () => {
    it.each(tasks)('%s accepts the entire canonical family and preserves the complete bundle evidence', task => {
        for (const data of cases) {
            const question = render(data, task, false);
            const solution = render(data, task, true);
            expect(answer(question)).toBe('');
            expect(answer(solution)).toBe(String(data.target));
            for (const markup of [question, solution]) {
                expect(occurrences(markup, 'aria-label="hundred flat"')).toBe(data.hundreds);
                expect(occurrences(markup, 'border-b border-r border-indigo-200')).toBe(data.hundreds * 100);
                expect(occurrences(markup, 'aria-label="ten rod"')).toBe(data.tens);
                expect(occurrences(markup, 'border-b border-sky-300 last:border-b-0')).toBe(data.tens * 10);
                expect(markup).toContain('<span>ones</span>');
            }
        }
    });

    it('asks for the represented ones rather than a count of tens in the completion leaf', () => {
        const question = render(cases[0], 'completion', false);
        const solution = render(cases[0], 'completion', true);
        expect(question).toContain('How many ones do these tens represent?');
        expect(question).toContain('<span>10 tens</span>');
        expect(question).not.toContain('How many tens make one hundred?');
        expect(answer(solution)).toBe('100');
        expect(question).not.toContain('Explain');
        expect(solution).not.toContain('aria-label="explanation"');
    });

    it('requests a regrouping explanation and withholds both the value and reasoning in the question', () => {
        const question = render(cases[0], 'explanation', false);
        const solution = render(cases[0], 'explanation', true);
        expect(question).toContain('Explain how to regroup these tens as a hundred and why the total stays the same.');
        expect(question).not.toContain('First check');
        expect(question).not.toContain('Every original one is kept');
        expect(answer(question)).toBe('');
        expect(answer(solution)).toBe('100');
        expect(solution).toContain('First check that each rod is a full ten, then group the 10 rods into one hundred.');
        expect(solution).toContain('Every original one is kept and counted once');
        expect(solution).toContain('still represents 100 ones.');
    });

    it.each([1, 3, 9])('explains how and why counting %s complete hundreds gives the supplied total', hundreds => {
        const data = cases[hundreds];
        const question = render(data, 'explanation', false);
        const solution = render(data, 'explanation', true);
        expect(question).toContain('Explain how to find the total from these hundreds and why your counting method works.');
        expect(question).not.toContain('Count each complete hundred flat once');
        expect(question).not.toContain('Each flat represents one hundred ones.');
        expect(solution).toContain('Count each complete hundred flat once. Say one hundred for the first flat, then count on by hundreds for each further flat.');
        expect(solution).toContain('Each flat represents one hundred ones.');
        expect(solution).toContain('Counting each flat once counts every one once');
        expect(solution).toContain(hundreds === 1 ? 'the 1 flat represents 100 ones.' : `the ${hundreds} flats represent ${data.target} ones.`);
    });

    it('adds no zero-valued components or new arithmetic expression to the explanation', () => {
        for (const data of cases) {
            const solution = render(data, 'explanation', true);
            const text = solution.replace(/<[^>]+>/g, ' ');
            expect(text).not.toMatch(/\b0\b|zero|no tens|no ones|left over|remainder|×|\+/i);
            expect(text).toContain(String(data.target));
        }
    });

    it.each(tasks)('%s is deterministic and introduces no seed-dependent mathematics', task => {
        const data = cases[7];
        expect(render(data, task, false, 17)).toEqual(render(data, task, false, 17));
        expect(render(data, task, true, 18)).toEqual(render(data, task, true, 17));
    });

    it.each(tasks)('%s rejects missing or inconsistent bundle evidence with the view validation error', task => {
        const valid = cases[3];
        for (const invalid of [
            {hundreds: undefined}, {tens: undefined}, {ones: undefined}, {target: undefined},
            {hundreds: 0}, {hundreds: 10}, {hundreds: 1.5}, {hundreds: Number.POSITIVE_INFINITY},
            {tens: 1}, {tens: 10}, {ones: 1}, {target: 400}, {target: Number.NaN}
        ]) {
            const data = {...valid, ...invalid} as PlaceValueHundredsBundlesProblem;
            expect(() => render(data, task, false)).toThrow(ViewValidationError);
            expect(() => render(data, task, true)).toThrow(ViewValidationError);
        }
        expect(() => render(undefined as unknown as PlaceValueHundredsBundlesProblem, task, false))
            .toThrow(ViewValidationError);
    });
});
