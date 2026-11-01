import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {makeSignedRational} from '../signed-rational-helpers.ts';
import {orderedContextRangeProfiles} from '../ordered-context-ranges.ts';
import {buildRationalMagnitudeContextProblem} from '../rational-magnitude-contexts/generator.ts';
import {ContextAbsoluteValueBody, ContextOrderExplanationBody, ContextOrderWritingBody,
    OrderVersusMagnitudeBody} from '../../../visuals/views/numbers/rational-order-magnitude-view.tsx';
import {buildRationalOrderContextProblem} from './generator.ts';

describe('all contextual order and magnitude projections retain the required zero datum', () => {
    it.each(['temperature', 'elevation', 'balance'] as const)('keeps both modes truthful at the %s canonical boundaries', context => {
        const framework = context === 'temperature' ? '0°C' : context === 'elevation' ? 'sea level' : 'zero is a settled balance';
        // ±5 and ±10 remain feasible because the required datum is0, rather than a positive floor.
        for (const [first, second, denominator, upper] of [
            [-5, 5, 1, 5], [-10, 10, 1, 10], [0, 5, 1, 5], [5, 10, 1, 10],
            [-10, -5, 1, 10], [-9, 7, 2, 5], [-19, 11, 2, 10]
        ] as const) {
            const values = [makeSignedRational(first, denominator), makeSignedRational(second, denominator)] as const;
            const order = buildRationalOrderContextProblem(context, ...values);
            const magnitude = buildRationalMagnitudeContextProblem(context, ...values);
            const range = orderedContextRangeProfiles.find(profile => profile.range.max === upper)!.range;
            expect(hasCanonicalRangeWitness([0, first / denominator, second / denominator], range)).toBe(true);
            for (const isSolutionView of [false, true]) {
                const projections = [
                    renderToStaticMarkup(<ContextOrderExplanationBody data={order} isSolutionView={isSolutionView} />),
                    renderToStaticMarkup(<ContextOrderWritingBody data={order} isSolutionView={isSolutionView} />),
                    renderToStaticMarkup(<ContextAbsoluteValueBody data={magnitude} isSolutionView={isSolutionView} />),
                    renderToStaticMarkup(<OrderVersusMagnitudeBody data={magnitude} isSolutionView={isSolutionView} />)
                ];
                for (const markup of projections) {
                    expect(markup).toContain(framework);
                    expect(markup).not.toMatch(/NaN|undefined|>20<|distance between/);
                    expect(markup.includes('text-emerald-900')).toBe(isSolutionView);
                }
                expect(projections[0]).toContain('data-role="given-inequality"');
                expect(projections[1]).toContain('data-role="order-context-prose"');
                expect(projections[2]!.includes('data-role="context-absolute-answer"')).toBe(isSolutionView);
                expect(projections[3]).toContain('data-role="comparison-statements"');
            }
        }
    });
});
