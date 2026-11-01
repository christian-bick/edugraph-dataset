import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import * as randomness from '../../../lib/random.ts';
import {multiplicationDomain, profileDigits} from './domain.ts';
import {MultiDigitMultiplicationGenerator} from './generator.ts';
import type {OperandDigitProfile} from './spec.ts';

let View: typeof import('../../../visuals/views/operations/operations-multiplication-area-model/view.tsx').OperationsMultiplicationAreaModel;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    View = (await import('../../../visuals/views/operations/operations-multiplication-area-model/view.tsx')).OperationsMultiplicationAreaModel;
});
afterEach(() => vi.restoreAllMocks());
afterAll(() => vi.unstubAllGlobals());

describe('partial-products canonical range projection', () => {
    it('preserves the factors, component equations and required final sum in Question and Solution', () => {
        const generator = new MultiDigitMultiplicationGenerator();
        let rendered = 0;
        const random = vi.spyOn(randomness, 'random');
        for (const profile of Object.keys(profileDigits) as OperandDigitProfile[]) {
            for (const {range} of canonicalRangeProfiles.filter(({range}) => range.max <= 100000 && [0, 5].includes(range.min))) {
                const domain = multiplicationDomain(profile, range);
                if (!domain.length) continue;
                for (const index of [0, Math.floor(domain.length / 2), domain.length - 1]) {
                    random.mockReturnValue((index + 0.5) / domain.length);
                    const data = generator.generate({operandDigitProfile: profile, range}).data;
                    expect([data.smallestOperand, data.largestOperand]).toEqual(domain[index]);
                    for (const isSolutionView of [false, true]) {
                        const markup = renderToStaticMarkup(createElement(View, {payload: {
                            problem: {type: 'arithmetic', data, labels: []}, isSolutionView, seed: 0,
                            viewId: 'operations-multiplication-area-model', preparedView: {version: 1,
                                viewId: 'operations-multiplication-area-model', config: {}, labels: [], randomState: 0,
                                planHash: 'projection', variantHash: 'projection'}
                        } as never}));
                        const text = markup.replace(/<[^>]*>/g, '').replace(/[\s,]/g, '');
                        expect(text).toContain(String(data.smallestOperand));
                        expect(text).toContain(String(data.largestOperand));
                        if (isSolutionView) {
                            expect(text).toContain(String(data.product));
                            for (const part of data.partialProducts) expect(text).toContain(String(part.product));
                        }
                        rendered++;
                    }
                }
            }
        }
        expect(rendered).toBe(150);
    });
});
