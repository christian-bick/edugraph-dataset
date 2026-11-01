import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import * as randomness from '../../../lib/random.ts';
import {partialQuotientDomain, partialQuotientFrame} from './domain.ts';
import {MultiDigitDivisionGenerator} from './generator.ts';

let View: typeof import('../../../visuals/views/operations/operations-division-area-model/view.tsx').OperationsDivisionAreaModel;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    View = (await import('../../../visuals/views/operations/operations-division-area-model/view.tsx')).OperationsDivisionAreaModel;
});
afterEach(() => vi.restoreAllMocks());
afterAll(() => vi.unstubAllGlobals());

describe('partial-quotient canonical range projection', () => {
    it('preserves every feasible profile boundary through the unchanged model and both modes', () => {
        const generator = new MultiDigitDivisionGenerator();
        const random = vi.spyOn(randomness, 'random');
        let rendered = 0;
        for (const dividendDigits of [1, 2, 3, 4] as const) for (const divisorDigits of [1, 2] as const) for (const requireZero of [false, true]) {
            for (const {range} of canonicalRangeProfiles.filter(({range}) => range.max <= 10000 && [0, 5].includes(range.min))) {
                const domain = partialQuotientDomain(dividendDigits, divisorDigits, requireZero, range);
                if (!domain.count) continue;
                for (const row of [domain.rows[0]!, domain.rows[Math.floor(domain.rows.length / 2)]!, domain.rows.at(-1)!]) {
                    const position = row.end - row.weight * row.remainders.length + row.weight / 2;
                    random.mockReturnValue(position / domain.weight);
                    const data = generator.generate({dividendDigits, divisorDigits, requireZero, range})!.data;
                    expect(data).toMatchObject(partialQuotientFrame(domain, position));
                    for (const isSolutionView of [false, true]) {
                        const markup = renderToStaticMarkup(createElement(View, {payload: {
                            problem: {type: 'arithmetic', data, labels: []}, isSolutionView, seed: 0,
                            viewId: 'operations-division-area-model', preparedView: {version: 1,
                                viewId: 'operations-division-area-model', config: {}, labels: [], randomState: 0,
                                planHash: 'projection', variantHash: 'projection'}
                        } as never}));
                        const text = markup.replace(/<[^>]*>/g, '').replace(/[\s,]/g, '');
                        expect(text).toContain(String(data.dividend));
                        expect(text).toContain(String(data.divisor));
                        if (isSolutionView) {
                            expect(text).toContain(String(data.quotient));
                            expect(text).toContain(String(data.remainder));
                            for (const step of data.partialQuotients) expect(text).toContain(String(step.partialProduct));
                        }
                        rendered++;
                    }
                }
            }
        }
        expect(rendered).toBe(168);
    });
});
