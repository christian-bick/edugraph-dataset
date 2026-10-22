import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area} from 'edugraph-ts';
import {getTargetPolicyLabels} from '../../lib/target-policies.ts';
import {buildCommonFactorMultipleProblem} from '../../generators/arithmetic/common-factor-multiple-relations/generator.ts';
import {commonPairLargeOracle, commonPairOneZeroOracle, commonPairOracle, commonPairZeroOracle, fullFactorMaximumOracle, fullFactorOracle} from '../helpers/common-factor-fixtures.ts';
import {FullCommonFactorBody, GreatestCommonFactorBody, LeastCommonMultipleBody} from './common-factor-view.tsx';
import {spec as fullSpec, OperationsFullCommonFactorViewSchema} from '../views/operations/operations-full-common-factor/spec.ts';
import {spec as gcdSpec, NumbersGreatestCommonFactorViewSchema} from '../views/numbers/numbers-greatest-common-factor/spec.ts';
import {spec as lcmSpec, NumbersLeastCommonMultipleViewSchema} from '../views/numbers/numbers-least-common-multiple/spec.ts';

const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const full = (solution: boolean, data = fullFactorOracle) => renderToStaticMarkup(<FullCommonFactorBody data={data} isSolutionView={solution} />);
const gcd = (solution: boolean, data = commonPairOracle) => renderToStaticMarkup(<GreatestCommonFactorBody data={data} isSolutionView={solution} />);
const lcm = (solution: boolean, data = commonPairOracle) => renderToStaticMarkup(<LeastCommonMultipleBody data={data} isSolutionView={solution} />);

describe('common-factor task projections', () => {
    it('keeps all work and results unresolved without solution styling or fallback glyphs', () => {
        for (const markup of [full(false), gcd(false), lcm(false), gcd(false, commonPairZeroOracle), lcm(false, commonPairZeroOracle)]) {
            expect(markup).toContain('data-role="given"');
            expect(markup).toContain('data-role="blank-work"');
            expect(markup).not.toContain('data-role="solution"');
            expect(markup).not.toContain('data-role="common-divisors"');
            expect(markup).not.toContain('emerald');
            expect(markup).not.toContain('□');
        }
        expect(full(false)).not.toContain('4(9 + 2)');
        expect(lcm(false)).not.toContain('24');
        expect(lcm(false, commonPairZeroOracle)).toContain('Use the zero-input extension of LCM.');
        expect(lcm(false, commonPairZeroOracle)).not.toContain('LCM(0, 0) = 0');
    });

    it('shows maximal factor evidence, actual distributive expansion and coprime residuals', () => {
        const solution = full(true);
        expect(text(solution)).toContain('Greatest common factor: 4');
        expect(text(solution)).toContain('36 = 4 × 9');
        expect(text(solution)).toContain('8 = 4 × 2');
        expect(text(solution)).toContain('36 + 8 = 4 × 9 + 4 × 2');
        expect(text(solution)).toContain('= 4(9 + 2) = 4 × 11 = 44');
        expect(text(solution)).toContain('Common positive factors of 9 and 2: 1.');
        expect(solution).toContain('emerald');
        expect(text(full(true, fullFactorMaximumOracle))).toContain('= 100(1 + 1) = 100 × 2 = 200');
    });

    it('shows the complete GCD list and handles one-zero and undefined-zero-pair branches truthfully', () => {
        expect(text(gcd(true))).toContain('GCD(8, 12) = 4');
        expect(text(gcd(true))).toContain('8 = 4 × 2');
        expect(text(gcd(true, commonPairOneZeroOracle))).toContain('GCD(0, 100) = 100');
        expect(text(gcd(true, commonPairOneZeroOracle))).toContain('0 = 100 × 0');
        const zero = gcd(true, commonPairZeroOracle);
        expect(text(zero)).toContain('GCD(0, 0) is undefined.');
        expect(text(zero)).toContain('Every positive integer divides 0');
        expect(zero).not.toContain('data-role="common-divisors"');
        expect(zero).not.toContain('GCD(0, 0) = 0');
    });

    it('shows the coprime-cofactor LCM proof and both supplied common products', () => {
        const solution = lcm(true);
        expect(text(solution)).toContain('8 = 4 × 2');
        expect(text(solution)).toContain('12 = 4 × 3');
        expect(text(solution)).toContain('Common positive factors of 2 and 3: 1. These cofactors are coprime.');
        expect(text(solution)).toContain('LCM(8, 12) = 4 × 2 × 3 = 24');
        expect(text(solution)).toContain('8 × 3 = 24');
        expect(text(solution)).toContain('12 × 2 = 24');
        expect(text(lcm(true, commonPairLargeOracle))).toContain('LCM(99, 100) = 1 × 99 × 100 = 9900');
    });

    it('uses the zero extension without a least-positive claim or undefined division', () => {
        for (const data of [commonPairZeroOracle, commonPairOneZeroOracle, buildCommonFactorMultipleProblem(100, 0)]) {
            const solution = lcm(true, data);
            expect(text(solution)).toContain('By the zero-input convention');
            expect(solution).toContain('data-role="zero-products"');
            expect(solution).not.toContain('least positive');
            expect(solution).not.toContain('÷');
            expect(solution).not.toContain('coprime');
            expect(solution).not.toMatch(/NaN|undefined|null/);
        }
        expect(() => lcm(true, {...commonPairOracle, gcd: {kind: 'undefined-zero-pair'}})).toThrow('positive LCM requires');
    });

    it('declares fixed execution tasks and participation requirements without owning the mathematical Areas', () => {
        for (const spec of [fullSpec, gcdSpec, lcmSpec]) expect(spec.generalLabels).toEqual([Ability.ProcedureExecution]);
        expect(new Set(getTargetPolicyLabels(fullSpec.compatibility, 'require'))).toEqual(new Set([Area.GreatestCommonDivisor, Area.DistributiveLaw]));
        expect(getTargetPolicyLabels(gcdSpec.compatibility, 'require')).toEqual([Area.GreatestCommonDivisor]);
        expect(getTargetPolicyLabels(lcmSpec.compatibility, 'require')).toEqual([Area.LeastCommonMultiple]);
        expect([OperationsFullCommonFactorViewSchema, NumbersGreatestCommonFactorViewSchema, NumbersLeastCommonMultipleViewSchema]).toEqual([{}, {}, {}]);
    });
});

let cores: readonly ComponentType<{config: object; payload: unknown}>[];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [full, gcd, lcm] = await Promise.all([
        import('../views/operations/operations-full-common-factor/view.tsx'), import('../views/numbers/numbers-greatest-common-factor/view.tsx'),
        import('../views/numbers/numbers-least-common-multiple/view.tsx')]);
    cores = [full.OperationsFullCommonFactorCore, gcd.NumbersGreatestCommonFactorCore, lcm.NumbersLeastCommonMultipleCore] as unknown as typeof cores;
});
afterAll(() => vi.unstubAllGlobals());

describe('common-factor leaf acceptance boundaries', () => {
    const leaf = (index: number, data: unknown, isSolutionView: boolean) => renderToStaticMarkup(createElement(cores[index]!, {config: {}, payload: {
        problem: {type: 'arithmetic', data, labels: []}, isSolutionView, targetLabels: [], seed: 31
    }}));
    it('accepts every valid witness branch in both pair leaves, independent of production method', () => {
        for (const data of [commonPairOracle, commonPairOneZeroOracle, commonPairZeroOracle, commonPairLargeOracle,
            buildCommonFactorMultipleProblem(100, 0), buildCommonFactorMultipleProblem(100, 100), buildCommonFactorMultipleProblem(1, 100)]) {
            for (const index of [1, 2]) for (const mode of [false, true]) expect(leaf(index, data, mode)).not.toContain('Validation Error');
        }
        for (const mode of [false, true]) expect(leaf(0, fullFactorMaximumOracle, mode)).not.toContain('Validation Error');
    });
    it('rejects malformed complete witnesses in Question as well as Solution', () => {
        for (const mode of [false, true]) {
            expect(() => leaf(0, {...fullFactorOracle, residualCommonDivisors: [1, 2]}, mode)).toThrow('inconsistent');
            expect(() => leaf(0, undefined, mode)).toThrow('missing');
            for (const index of [1, 2]) {
                expect(() => leaf(index, {...commonPairOracle, lcm: {kind: 'positive', value: 48, commonMultipliers: [6, 4], commonProducts: [48, 48]}}, mode)).toThrow('inconsistent');
                expect(() => leaf(index, {...commonPairZeroOracle, gcd: {kind: 'defined', value: 0, commonDivisors: []}}, mode)).toThrow('inconsistent');
            }
        }
    });
});
