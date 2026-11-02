import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {roundingDomain, roundingFrame} from './domain.ts';
import {roundingPlaces} from './endpoint-profile.ts';

let View: typeof import('../../../visuals/views/numbers/numbers-rounding-line/view.tsx').NumbersRoundingLine;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    View = (await import('../../../visuals/views/numbers/numbers-rounding-line/view.tsx')).NumbersRoundingLine;
});
afterAll(() => vi.unstubAllGlobals());

describe('rounding canonical annotations and same-value projections', () => {
    it('renders Question/Solution at both boundaries of every admitted cell without label-dependent changes', () => {
        let rendered = 0;
        for (const [, place] of roundingPlaces) for (const zero of [false, true]) {
            for (const {range, labels} of canonicalRangeProfiles) {
                const domain = roundingDomain(place, zero, range);
                if (!domain.count) continue;
                for (const position of [0, domain.weight * (1 - Number.EPSILON)]) {
                    const data = roundingFrame(domain, position);
                    for (const isSolutionView of [false, true]) {
                        const render = (labels: string[]) => renderToStaticMarkup(<View payload={{
                            problem: {type: 'arithmetic', data, labels}, viewId: 'numbers-rounding-line',
                            targetLabels: [], seed: 13, isSolutionView, preparedView: {version: 1,
                                viewId: 'numbers-rounding-line', config: {}, labels: [], randomState: 13,
                                planHash: 'projection', variantHash: 'projection'}
                        }} />);
                        const markup = render(labels);
                        expect(markup).toBe(render([]));
                        if (isSolutionView) expect(markup.toLowerCase()).toContain('distance');
                        rendered++;
                    }
                }
            }
        }
        expect(rendered).toBeGreaterThan(200);
    });
});
