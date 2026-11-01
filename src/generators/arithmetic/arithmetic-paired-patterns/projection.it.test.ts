import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {PairedPatternView} from '../../../visuals/views/operations/paired-pattern-view.tsx';
import {pairedPatternDomain} from './domain.ts';
import {ArithmeticPairedPatternsGenerator} from './generator.ts';

describe('paired-pattern indexed-quantity projections', () => {
    it('keeps recurrence positions0..5 and their alignment requirement in all three tasks and both modes', () => {
        const random = vi.spyOn(rng, 'random');
        let rendered = 0, positiveFrameProjections = 0;
        try {
            for (const hasCorrespondence of [false, true]) for (const upper of hasCorrespondence ? [20, 100] : [10, 20, 100]) {
                const range = createCanonicalNumericRange(upper);
                const candidates = pairedPatternDomain(hasCorrespondence, range);
                const positive = candidates.find(frame => frame.firstStart >= 5 && frame.secondStart >= 5
                    && frame.firstIncrement >= 5 && frame.secondIncrement >= 5
                    && (!frame.correspondence || frame.correspondence.kind === 'additive' && frame.correspondence.difference >= 5));
                const chosen = [candidates[0]!, candidates[Math.floor(candidates.length / 2)]!, candidates.at(-1)!,
                    ...(positive ? [positive] : [])];
                const total = candidates.reduce((sum, frame) => sum + frame.weight, 0);
                for (const frame of chosen) {
                    const cumulative = candidates.slice(0, candidates.indexOf(frame)).reduce((sum, current) => sum + current.weight, 0);
                    random.mockReturnValue((cumulative + frame.weight / 2) / total);
                    const {data} = new ArithmeticPairedPatternsGenerator().generate({hasCorrespondence, range});
                    const modes = hasCorrespondence ? ['identify', 'explain'] as const : ['generate'] as const;
                    for (const mode of modes) for (const isSolutionView of [false, true]) {
                        const viewId = mode === 'generate' ? 'operations-paired-pattern-generation'
                            : mode === 'identify' ? 'operations-pattern-correspondence' : 'operations-pattern-correspondence-explanation';
                        const text = renderToStaticMarkup(createElement(PairedPatternView, {
                            mode, viewId, payload: {problem: {type: 'arithmetic', data, labels: []}, isSolutionView, seed: 0} as never
                        })).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').replace(/\s+;/g, ';').trim();
                        expect(text).toContain('Position 0 1 2 3 4 5');
                        expect(text).toContain('position');
                        expect(text).toContain(`Start at ${data.first.start}; add ${data.first.rule.increment} each step.`);
                        expect(text).toContain(`Start at ${data.second.start}; add ${data.second.rule.increment} each step.`);
                        if (isSolutionView || mode !== 'generate') expect(text).toContain(`${data.second.terms.at(-1)}`);
                        if (frame === positive) {
                            expect(Math.min(...data.first.terms, ...data.second.terms)).toBeGreaterThanOrEqual(5);
                            expect(hasCanonicalRangeWitness([0, 1, 2, 3, 4, 5, ...data.first.terms, ...data.second.terms], range)).toBe(true);
                            positiveFrameProjections++;
                        }
                        rendered++;
                    }
                }
            }
            expect(rendered).toBe(48);
            expect(positiveFrameProjections).toBe(6);
        } finally {
            random.mockRestore();
        }
    });
});
