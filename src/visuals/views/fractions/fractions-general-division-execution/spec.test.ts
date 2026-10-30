import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Scope} from 'edugraph-ts';
import {FractionDivisionRelationsGenerator} from '../../../../generators/fraction/fraction-division-relations/generator.ts';
import {FractionQuotientModelGenerator} from '../../../../generators/fraction/fraction-quotient-model/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {FractionDivisionRelationProblem, FractionQuotientProblem} from '../../../../types/problems.ts';
import {GeneralFractionDivisionBody} from '../fraction-division-view.tsx';
import {FractionsGeneralDivisionExecutionViewSchema, spec} from './spec.ts';

const profiles = ['fraction-by-fraction-proper', 'fraction-by-fraction-improper', 'fraction-by-integer-proper',
    'fraction-by-integer-improper', 'integer-by-fraction-proper', 'integer-by-fraction-improper'] as const;
let GeneralCore: typeof import('./view.tsx')['FractionsGeneralDivisionExecutionCore'];
let QuotientCore: typeof import('../fractions-division-execution/view.tsx')['FractionsDivisionExecutionCore'];

beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [general, quotient] = await Promise.all([
        import('./view.tsx'), import('../fractions-division-execution/view.tsx')]);
    GeneralCore = general.FractionsGeneralDivisionExecutionCore;
    QuotientCore = quotient.FractionsDivisionExecutionCore;
});
afterAll(() => vi.unstubAllGlobals());

const generalPayload = (data: FractionDivisionRelationProblem, isSolutionView: boolean):
    ViewRenderPayload<'fractions-general-division-execution'> => ({viewId: 'fractions-general-division-execution',
    problem: {type: 'fraction', data, labels: []}, targetLabels: [], isSolutionView, seed: 42});
const quotientPayload = (data: FractionQuotientProblem, isSolutionView: boolean):
    ViewRenderPayload<'fractions-division-execution'> => ({viewId: 'fractions-division-execution',
    problem: {type: 'fraction', data, labels: []}, targetLabels: [], isSolutionView, seed: 42});
const render = (data: FractionDivisionRelationProblem, solution: boolean) =>
    renderToStaticMarkup(createElement(GeneralCore, {payload: generalPayload(data, solution)}));

describe('general division execution split', () => {
    it('declares the numerical scale and proportional bars while leaving zero ownership to the producer', () => {
        expect(FractionsGeneralDivisionExecutionViewSchema).toEqual({});
        expect(spec.generalLabels).toEqual([Ability.ProcedureExecution, Scope.ArabicNumerals, Scope.Base10,
            Scope.Numberline, Scope.BarModel]);
        expect(spec).not.toHaveProperty('inferredLabels');
        expect(spec.compatibility).toBeUndefined();
    });

    it('preserves the exact general rendering and numerical-zero/bar evidence in both modes for all six profiles', () => {
        const generator = new FractionDivisionRelationsGenerator();
        const contexts = new Set<string>();
        const dividends = new Set<string>();
        for (const operandProfile of profiles) for (const groupCountProfile of operandProfile === 'fraction-by-integer-proper'
            ? ['zero'] as const : ['zero', 'positive'] as const) for (const withEquation of [false, true]) {
            for (const withMultiplication of [false, true]) for (let seed = 0; seed < 8; seed++) {
                setSeed(`general-execution-split-${operandProfile}-${withEquation}-${withMultiplication}-${seed}`);
                const {data} = generator.generate({operandProfile, groupCountProfile, withEquation, withMultiplication});
                expect(data.model.completeGroups === 0).toBe(groupCountProfile === 'zero');
                contexts.add(data.context.kind);
                dividends.add(data.dividend.numerator === 0 ? 'zero' : 'positive');
                for (const solution of [false, true]) {
                    const markup = render(data, solution);
                    expect(markup).toBe(renderToStaticMarkup(createElement(GeneralFractionDivisionBody,
                        {data, isSolutionView: solution, task: 'division-execution'})));
                    expect(markup).toMatch(/<line x1="32" x2="732" y1="38" y2="38"/);
                    expect(/<text[^>]*x="32"[^>]*>0<\/text>/.test(markup)).toBe(groupCountProfile === 'zero');
                    expect(markup).toMatch(/<text[^>]*>1<\/text>/);
                    expect(markup).toContain(solution ? `The numerical model has ${data.model.completeGroups} complete divisor-sized`
                        : 'Use the count of complete divisor-sized groups');
                    const parts = [...markup.matchAll(/<rect[^>]* y="83" width="([^"]+)" height="29" fill="([^"]+)"/g)];
                    expect(parts).toHaveLength(data.model.coverageTicks);
                    expect(parts.filter(part => part[2] === '#a5b4fc')).toHaveLength(data.model.dividendTicks);
                    for (const part of parts) expect(Number(part[1])).toBeCloseTo(700 / data.model.coverageTicks, 12);
                    expect(markup.match(/ y="219" width="[^"]+" height="27"/g)).toHaveLength(data.model.divisorTicks);
                    expect(markup.includes('The exact quotient is')).toBe(solution);
                    expect(markup.includes('data-response="answer-blank"')).toBe(!solution);
                }
            }
        }
        expect(contexts).toEqual(new Set(['sharing', 'measured-groups', 'rectangle']));
        expect(dividends).toEqual(new Set(['zero', 'positive']));
    });

    it('rejects the other valid payload family statically and at runtime in both directions', () => {
        const general = new FractionDivisionRelationsGenerator().generate({operandProfile: 'fraction-by-fraction-proper',
            groupCountProfile: 'zero', withEquation: false, withMultiplication: false}).data;
        const quotient = new FractionQuotientModelGenerator().generate({relationProfile: 'unit-divisor-basic', numericProfile: 'zero'}).data;
        for (const solution of [false, true]) {
            // @ts-expect-error The new leaf accepts the named general relation, never a legacy quotient problem.
            const wrongGeneral = generalPayload(quotient, solution);
            // @ts-expect-error The retained leaf accepts the named quotient problem, never a general relation.
            const wrongQuotient = quotientPayload(general, solution);
            expect(() => renderToStaticMarkup(createElement(GeneralCore, {payload: wrongGeneral}))).toThrow(/Validation Error/);
            expect(() => renderToStaticMarkup(createElement(QuotientCore, {payload: wrongQuotient}))).toThrow(/Validation Error/);
        }
    });

});
