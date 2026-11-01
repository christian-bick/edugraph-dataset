import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {ArithmeticWordProblemWithin100View} from '../../../visuals/views/operations/arithmetic-word-problem-within-100-view.tsx';
import {twoStepDomain, twoStepFrame} from './domain.ts';

describe('two-step story range projections', () => {
    it('preserves both connected calculations for every feasible operation/range cell in Question and Solution', () => {
        let rendered = 0;
        for (const first of ['addition', 'subtraction', 'multiplication', 'division'] as const) {
            for (const second of ['addition', 'subtraction', 'multiplication', 'division'] as const) {
                for (const {range} of canonicalRangeProfiles.filter(({range}) => range.max <= 100 && [0, 5, 10, 20].includes(range.min))) {
                    const domain = twoStepDomain([first, second], range);
                    if (!domain.count) continue;
                    for (const index of [0, Math.floor(domain.count / 2), domain.count - 1]) {
                        const data = twoStepFrame(domain, [first, second], index);
                        for (const isSolutionView of [false, true]) {
                            const markup = renderToStaticMarkup(createElement(ArithmeticWordProblemWithin100View, {
                                config: {invertProcedure: false, useLengthContext: false},
                                payload: {problem: {type: 'arithmetic', data, labels: []}, isSolutionView, seed: 0} as never
                            }));
                            const text = markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
                            expect(text).toContain(String(data.num1));
                            expect(text).toContain(String(data.num2));
                            expect(text).toContain(String(data.num3));
                            if (isSolutionView) {
                                expect(text).toContain(String(data.intermediate));
                                expect(text).toContain(String(data.answer));
                            }
                            rendered++;
                        }
                    }
                }
            }
        }
        expect(rendered).toBe(600);
    });
});
