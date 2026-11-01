import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {presentMultiplicativeComparison} from '../../../visuals/views/operations/multiplicative-comparison-presentation.ts';
import {MultiplicativeComparisonGeneratorSchema as schema} from './spec.ts';
import {comparisonDomain} from './domain.ts';

afterEach(() => {vi.restoreAllMocks(); vi.unstubAllGlobals();});

describe('multiplicative comparison range projections', () => {
    it('preserves all old pairs in both views, modes and supported unknown roles', async () => {
        vi.stubGlobal('window', {});
        const {OperationsMultiplicativeComparison} = await import('../../../visuals/views/operations/operations-multiplicative-comparison/view.tsx');
        const {OperationsMultiplicativeComparisonWordProblem} = await import('../../../visuals/views/operations/operations-multiplicative-comparison-word-problem/view.tsx');
        const random = vi.spyOn(rng, 'random');
        let rendered = 0;
        for (const labels of schema.profile[2]) {
            for (const data of comparisonDomain(extractConfig(schema, [...labels]).config.profile!)) {
                const views = data.operation === 'multiplication'
                    ? ['operations-multiplicative-comparison', 'operations-multiplicative-comparison-word-problem']
                    : ['operations-multiplicative-comparison-word-problem'];
                for (const viewId of views) {
                    const roles = data.operation === 'multiplication' ? ['compared'] as const : ['reference', 'scale-factor'] as const;
                    for (const role of roles) for (const isSolutionView of [false, true]) {
                        random.mockReturnValue(role === 'scale-factor' ? 0.75 : 0.25);
                        rng.setSeed(42);
                        const payload = {problem: {type: 'arithmetic', data, labels: []}, viewId, isSolutionView, seed: 42,
                            preparedView: {version: 1, viewId, planHash: 'projection-contract', variantHash: 'projection-contract',
                                config: {}, randomState: rng.getRandomState()}};
                        const component = viewId === 'operations-multiplicative-comparison'
                            ? OperationsMultiplicativeComparison : OperationsMultiplicativeComparisonWordProblem;
                        const text = renderToStaticMarkup(createElement(component, {payload: payload as never})).replace(/<[^>]*>/g, ' ');
                        const presentation = presentMultiplicativeComparison(data, role);
                        if (viewId === 'operations-multiplicative-comparison') {
                            expect(text).toContain('Interpret the multiplication equation as a comparison.');
                            expect(text).toContain(`${data.referenceQuantity}`);
                            expect(text).toContain(`${data.scaleFactor}`);
                            expect(text).toContain(`${data.comparedQuantity}`);
                        } else {
                            expect(text).toContain(presentation.story);
                            expect(text).toContain(presentation.givenEquation);
                            expect(text.includes(presentation.solutionEquation)).toBe(isSolutionView);
                        }
                        rendered++;
                    }
                }
            }
        }
        expect(rendered).toBe(696);
    });
});
