import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {WholeNumberLengthProblem, WritingProblem} from '../../../../types/problems.ts';
import {OperationsNumberLineView} from '../operations-number-line-view.tsx';

let Core: typeof import('./view.tsx')['OperationsNumberLineRepresentationCore'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Core = (await import('./view.tsx')).OperationsNumberLineRepresentationCore;
});
afterAll(() => vi.unstubAllGlobals());

const payload = (data: WholeNumberLengthProblem, isSolutionView: boolean):
    ViewRenderPayload<'operations-number-line-representation'> => ({
    problem: {type: 'writing', data, labels: []}, viewId: 'operations-number-line-representation',
    targetLabels: [], isSolutionView, seed: 1
});
const render = (data: WholeNumberLengthProblem, solution: boolean) =>
    renderToStaticMarkup(createElement(Core, {config: {}, payload: payload(data, solution)}));

describe('rooted whole-number length projection', () => {
    it('retains a zero origin and exact endpoint throughout the complete supported display domain', () => {
        for (let endpoint = 0; endpoint <= 100; endpoint++) {
            const data: WholeNumberLengthProblem = {kind: 'whole-number-length', origin: 0, endpoint, unit: 1};
            const question = render(data, false), solution = render(data, true);
            for (const markup of [question, solution]) {
                expect(markup).toContain(`Mark ${endpoint} as a length from 0.`);
                expect(markup).toContain('Number line beginning at zero');
                expect(markup).toMatch(/<text[^>]*>0<\/text>/);
            }
            expect(question).not.toContain('stroke="#059669"');
            const maximum = endpoint <= 5 ? 5 : Math.max(10, Math.ceil(endpoint / 10) * 10);
            const endX = 48 + endpoint / maximum * 664;
            expect(solution).toContain(`<line x1="48" y1="120" x2="${endX}"`);
            expect(solution).toContain(`>${endpoint}</text>`);
            if (endpoint <= 5) {
                expect(question).not.toContain('>10</text>');
                expect(solution).not.toContain('>10</text>');
                expect(question).not.toContain('>0.5</text>');
            }
        }
    });

    it('cannot hide the required origin through an unrooted presentation option', () => {
        const markup = renderToStaticMarkup(<OperationsNumberLineView mode="representation"
            viewId="operations-number-line-representation" showZeroReference={false}
            payload={payload({kind: 'whole-number-length', origin: 0, endpoint: 37, unit: 1}, false)} />);
        expect(markup).toContain('Number line beginning at zero');
        expect(markup).toMatch(/<text[^>]*>0<\/text>/);
    });

    it('rejects legacy writing and malformed rooted relations instead of falling back', () => {
        const scalar: WritingProblem = {number: 37};
        // @ts-expect-error The representation contract now requires a canonical rooted relation.
        const legacy = payload(scalar, false);
        expect(() => renderToStaticMarkup(createElement(Core, {config: {}, payload: legacy}))).toThrow(/Validation Error/);
        const valid = {kind: 'whole-number-length', origin: 0, endpoint: 37, unit: 1} as const;
        for (const corrupt of [{...valid, origin: 1}, {...valid, unit: 2}, {...valid, kind: 'scalar'},
            {...valid, endpoint: -1}, {...valid, endpoint: 101}, {...valid, endpoint: 1.5},
            {kind: 'whole-number-length', origin: 0, endpoint: 37}]) {
            expect(() => render(corrupt as WholeNumberLengthProblem, false)).toThrow(/Validation Error/);
        }
    });
});
