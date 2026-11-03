import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {singlePowerCandidates} from '../../../../generators/arithmetic/numerical-power-expressions/numeric-profiles.ts';
import {buildNumericalPowerExpressionProblem} from '../../../../generators/arithmetic/numerical-power-helpers.ts';
import {buildNumericalPowerExpressionSyntaxProblem} from '../../../../generators/arithmetic/numerical-power-syntax-helpers.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../../lib/canonical-numeric-range.ts';
import {NumericalPowerWritingBody} from '../numerical-power-expression-view.tsx';
import {spec} from './spec.ts';

describe('prescribed power-writing range ownership', () => {
    it('bounds every admitted base and exponent while withholding the explicitly unused calculated value in both modes', () => {
        expect(spec.generalLabels).not.toContain(Scope.NumbersSmaller5);
        let paths = 0, rendered = 0, outsideUnusedResults = 0;
        for (const positive of [false, true]) {
            const candidates = ([1, 2, 3, 4] as const).flatMap(profile => singlePowerCandidates(positive, profile));
            // Independent count of the original exponent/denominator/magnitude/sign draws.
            const expected = Array.from({length: positive ? 3 : 4}, (_, index) => index + Number(positive))
                .reduce((total, exponent) => total + [1, 2, 3, 4]
                    .reduce((sum, denominator) => sum + 2 * (3 * denominator + Number(exponent !== 0)), 0), 0);
            expect(candidates).toHaveLength(expected);
            for (const candidate of candidates) {
                const value = candidate.base.numerator / candidate.base.denominator;
                expect(hasCanonicalRangeWitness([value, candidate.exponent], createCanonicalNumericRange(5))).toBe(true);
                const syntax = buildNumericalPowerExpressionSyntaxProblem({id: 'power', kind: 'power', exponent: candidate.exponent,
                    base: {id: 'base', kind: 'number', value: candidate.base, notation: candidate.base.denominator === 1
                        ? {kind: 'integer', numeral: String(candidate.base.numerator)} : {kind: 'fraction', ...candidate.base}}});
                const data = buildNumericalPowerExpressionProblem(syntax.expression,
                    {domain: 'rational', maximumAbsoluteValue: {numerator: 100, denominator: 1},
                        maximumNodes: 25, maximumDepth: 8, maximumExponent: 3});
                if (Math.abs(data.finalValue.numerator / data.finalValue.denominator) > 5) outsideUnusedResults++;
                for (const isSolutionView of [false, true]) {
                    const markup = renderToStaticMarkup(createElement(NumericalPowerWritingBody, {data: syntax, isSolutionView}));
                    expect(markup).toContain('Do not find its value.');
                    expect(markup).not.toMatch(/power-reduction|power-fact|power-final-value/);
                    expect(markup.includes('power-written-answer')).toBe(isSolutionView);
                    rendered++;
                }
                paths++;
            }
        }
        expect(paths).toBe(468);
        expect(rendered).toBe(936);
        expect(outsideUnusedResults).toBeGreaterThan(0);
    });
});
