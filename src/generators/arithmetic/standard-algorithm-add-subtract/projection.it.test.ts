import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Scope} from 'edugraph-ts';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {setSeed} from '../../../lib/random.ts';
import {standardAlgorithmPresentation} from '../../../visuals/views/operations/operations-standard-algorithm/helpers.ts';
import {StandardAlgorithmAddSubtractGenerator} from './generator.ts';

let View: typeof import('../../../visuals/views/operations/operations-standard-algorithm/view.tsx').OperationsStandardAlgorithm;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    View = (await import('../../../visuals/views/operations/operations-standard-algorithm/view.tsx')).OperationsStandardAlgorithm;
});
afterAll(() => vi.unstubAllGlobals());

describe('integer-column annotation correction projections', () => {
    it('retains identical same-value Question/Solution markup while exposing the required column method', () => {
        const generator = new StandardAlgorithmAddSubtractGenerator();
        let rendered = 0;
        for (const upper of [1000, 10000, 100000, 1000000]) for (const operation of ['addition', 'subtraction'] as const) {
            for (const seed of [0, 17, 77]) {
                setSeed(seed);
                const data = generator.generate({operation, range: createCanonicalNumericRange(upper)})!.data;
                for (const isSolutionView of [false, true]) {
                    const render = (labels: string[]) => renderToStaticMarkup(createElement(View, {payload: {
                        problem: {type: 'arithmetic', data, labels}, isSolutionView, seed,
                        viewId: 'operations-standard-algorithm', preparedView: {version: 1,
                            viewId: 'operations-standard-algorithm', config: {}, labels: [], randomState: seed,
                            planHash: 'projection', variantHash: 'projection'}
                    } as never}));
                    const markup = render([Scope.IntegerNumbers]);
                    expect(markup).toBe(render([upper === 1000 ? Scope.NumbersLarger100 : Scope.NumbersLarger1000]));
                    const text = markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
                    if (isSolutionView) for (const column of standardAlgorithmPresentation(data).columns) {
                        expect(text).toContain(column.calculation);
                    }
                    else expect(text).toContain('Work from the ones place to the left.');
                    rendered++;
                }
            }
        }
        expect(rendered).toBe(48);
    });
});
