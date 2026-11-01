import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {NumbersFactorsMultiplesView} from '../../../visuals/views/numbers/factors-multiples-view.tsx';
import {factorMultipleRangeProfiles, factorPairNumbers, multipleTestCases} from './domain.ts';
import {FactorMultipleRelationsGenerator} from './generator.ts';

describe('canonical factor proof projections', () => {
    it('retains the required number/divisor inputs and complete solution proof across all original cases', () => {
        const draw = vi.spyOn(rng, 'random');
        const generator = new FactorMultipleRelationsGenerator();
        let projections = 0;
        try {
            for (const {range} of factorMultipleRangeProfiles) {
                const numbers = factorPairNumbers(range), cases = multipleTestCases(range);
                const mass = cases.reduce((total, item) => total + item.weight, 0);
                let before = 0;
                for (const task of ['factor-pairs', 'one-digit-multiple-test'] as const) {
                    const count = task === 'factor-pairs' ? numbers.length : cases.length;
                    for (let index = 0; index < count; index++) {
                        draw.mockReturnValue(task === 'factor-pairs' ? (index + 0.5) / count
                            : (before + cases[index]!.weight / 2) / mass);
                        const {data} = generator.generate({task, range});
                        for (const isSolutionView of [false, true]) {
                            const text = renderToStaticMarkup(createElement(NumbersFactorsMultiplesView, {
                                expectedKinds: [data.kind], payload: {problem: {type: 'arithmetic', data, labels: []},
                                    isSolutionView, seed: 0} as never
                            })).replace(/<[^>]*>/g, ' ');
                            if (data.kind === 'factor-pairs') {
                                expect(text).toContain(`Find every positive factor pair of ${data.number}.`);
                                expect(text.includes('All positive factors')).toBe(isSolutionView);
                                expect(text.includes('Unique factor pairs')).toBe(isSolutionView);
                            } else {
                                expect(text).toContain(`Is ${data.candidate} a multiple of ${data.divisor}?`);
                                expect(text.includes(`${data.candidate} ÷ ${data.divisor} = ${data.quotient}`)).toBe(isSolutionView);
                                expect(text.includes('Divides evenly')).toBe(isSolutionView);
                            }
                            projections++;
                        }
                        if (task === 'one-digit-multiple-test') before += cases[index]!.weight;
                    }
                }
            }
            expect(projections).toBe(554);
        } finally {
            draw.mockRestore();
        }
    });
});
