import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FullCommonFactorBody} from '../../../visuals/components/common-factor-view.tsx';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {buildFullCommonFactorDistributionProblem} from './generator.ts';

describe('full common-factor canonical range projections', () => {
    it('preserves required full extraction, residual proof and final sum at every band boundary', () => {
        let rendered = 0;
        for (const upper of [5, 10, 20, 100, 120, 1000]) {
            const range = createCanonicalNumericRange(upper);
            const candidates = [];
            for (let first = 1; first <= 100; first++) for (let second = 1; second <= 100; second++) {
                if (first + second <= range.maximumAbove || first + second > upper) continue;
                if (!Array.from({length: Math.min(first, second) - 1}, (_, index) => index + 2)
                    .some(divisor => first % divisor === 0 && second % divisor === 0)) continue;
                candidates.push(buildFullCommonFactorDistributionProblem(first, second));
            }
            for (const data of [candidates[0]!, candidates[Math.floor(candidates.length / 2)]!, candidates.at(-1)!]) {
                for (const isSolutionView of [false, true]) {
                    const markup = renderToStaticMarkup(createElement(FullCommonFactorBody, {data, isSolutionView}));
                    const text = markup.replace(/<[^>]*>/g, ' ');
                    expect(text).toContain(`${data.addends[0]} + ${data.addends[1]}`);
                    expect(markup.includes('data-role="solution"')).toBe(isSolutionView);
                    if (isSolutionView) {
                        expect(text).toContain(`${data.gcd} × ${data.residualSum} = ${data.sum}`);
                        expect(text).toContain(`Common positive factors of ${data.residualAddends[0]} and ${data.residualAddends[1]}: 1.`);
                    }
                    rendered++;
                }
            }
        }
        expect(rendered).toBe(36);
    });
});
