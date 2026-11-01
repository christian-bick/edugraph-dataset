import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {GreatestCommonFactorBody, LeastCommonMultipleBody} from '../../../visuals/components/common-factor-view.tsx';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {commonRelationDomain} from './domain.ts';
import {buildCommonFactorMultipleProblem} from './generator.ts';

describe('common relation canonical range projections', () => {
    it('preserves each band boundary and the separate GCD/LCM proof contracts in both modes', () => {
        let rendered = 0;
        for (const operation of ['gcd', 'lcm'] as const) {
            for (const upper of operation === 'gcd' ? [5, 10, 20, 100] : [5, 10, 20, 100, 120, 1000]) {
                const candidates = commonRelationDomain({operation, range: createCanonicalNumericRange(upper)});
                for (const candidate of [candidates[0]!, candidates[Math.floor(candidates.length / 2)]!, candidates.at(-1)!]) {
                    const data = buildCommonFactorMultipleProblem(...candidate.inputs);
                    for (const isSolutionView of [false, true]) {
                        const component = operation === 'gcd' ? GreatestCommonFactorBody : LeastCommonMultipleBody;
                        const markup = renderToStaticMarkup(createElement(component, {data, isSolutionView}));
                        const text = markup.replace(/<[^>]*>/g, ' ');
                        expect(text).toContain(`${data.inputs[0]} and ${data.inputs[1]}`);
                        expect(markup.includes('data-role="solution"')).toBe(isSolutionView);
                        if (isSolutionView) {
                            expect(text).toContain(operation === 'gcd'
                                ? `GCD(${data.inputs[0]}, ${data.inputs[1]}) = ${data.gcd.kind === 'defined' ? data.gcd.value : 'undefined'}`
                                : `LCM(${data.inputs[0]}, ${data.inputs[1]}) =`);
                        }
                        rendered++;
                    }
                }
            }
        }
        expect(rendered).toBe(60);
        const data = buildCommonFactorMultipleProblem(99, 100);
        const text = renderToStaticMarkup(createElement(GreatestCommonFactorBody, {data, isSolutionView: true}));
        expect(data.lcm.value).toBe(9900);
        expect(text).not.toContain('9900');
        expect(text).toContain('Common positive factors:');
    });
});
