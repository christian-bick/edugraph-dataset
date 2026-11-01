import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {KnownFactDerivationView} from '../../../visuals/views/operations/known-fact-derivation-view.tsx';
import {knownFactDomain} from './domain.ts';

describe('known-fact canonical range projections', () => {
    it('preserves given facts and required derived relationships in both tasks and modes', () => {
        let rendered = 0;
        for (const strategy of ['commutative', 'associative', 'inverse-division', 'place-value-scaling'] as const) {
            for (const {range} of canonicalRangeProfiles.filter(profile => profile.range.max <= 1000 && [0, 5].includes(profile.range.min))) {
                const candidates = knownFactDomain(strategy, range);
                if (!candidates.length) continue;
                for (const data of [candidates[0]!, candidates[Math.floor(candidates.length / 2)]!, candidates.at(-1)!]) {
                    for (const mode of ['understanding', 'inversion'] as const) for (const isSolutionView of [false, true]) {
                        const viewId = mode === 'understanding' ? 'operations-known-fact-derivation' : 'operations-known-fact-inversion';
                        const text = renderToStaticMarkup(createElement(KnownFactDerivationView, {
                            mode, viewId, payload: {problem: {type: 'arithmetic', data, labels: []}, isSolutionView, seed: 0} as never
                        })).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
                        expect(text).toContain(`${data.knownFact.firstFactor} × ${data.knownFact.secondFactor} = ${data.knownFact.product}`);
                        expect(text).toContain(isSolutionView ? 'Derived fact' : 'Find the related fact');
                        if (isSolutionView) expect(text).toContain(`${data.answer}`);
                        if (strategy === 'place-value-scaling') expect(text).toContain('× 10');
                        rendered++;
                    }
                }
            }
        }
        expect(rendered).toBe(228);
    });
});
