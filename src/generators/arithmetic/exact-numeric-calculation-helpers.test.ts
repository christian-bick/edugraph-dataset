import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {ExactNumericExpressionConstraints, ExactNumericalExpressionNode as Node} from '../../types/problems.ts';
import {buildExactNumericCalculation as build, isExactNumericCalculation as valid, selectNextNumericReduction} from './exact-numeric-calculation-helpers.ts';
import {buildNumericalPowerExpressionProblem, isNumericalPowerExpressionProblem} from './numerical-power-helpers.ts';

const n = (id: string, numerator: number, denominator = 1): Extract<Node, {kind: 'number'}> => ({id, kind: 'number', value: {numerator, denominator},
    notation: denominator === 1 ? {kind: 'integer', numeral: String(numerator)} : {kind: 'fraction', numerator, denominator}});
const policy: ExactNumericExpressionConstraints = {domain: 'rational', maximumAbsoluteValue: {numerator: 100, denominator: 1},
    maximumNodes: 25, maximumDepth: 8, maximumExponent: 3};

describe('general exact numeric calculation component', () => {
    it('accepts an unpowered literal with exactly one value and genuinely empty facts/work', () => {
        const expression = n('a', 1, 2);
        const result = build(expression, policy);
        expect(result).toEqual({expression, nodeValues: [{nodeId: 'a', value: {numerator: 1, denominator: 2}}],
            powerFacts: [], reductions: [], finalValue: {numerator: 1, denominator: 2}, precedenceWitness: null});
        expect(valid(result)).toBe(true);
        expect(selectNextNumericReduction(expression)).toBeNull();
        const decimal: Node = {...expression, notation: {kind: 'decimal', coefficient: 500, scale: 3, numeral: '0.500'}};
        expect(valid(build(decimal, policy))).toBe(true);
        const unreduced: Node = {...expression, notation: {kind: 'fraction', numerator: 2, denominator: 4}};
        expect(valid(build(unreduced, policy))).toBe(true);
    });

    it('records a real explicit group even when its only content is an atom', () => {
        const expression: Node = {id: 'g', kind: 'group', expression: n('a', 2)};
        const result = build(expression, policy);
        expect(result.powerFacts).toEqual([]);
        expect(result.reductions).toEqual([{targetNodeId: 'g', path: [], evidence: {kind: 'group', enclosedValue: {numerator: 2, denominator: 1},
            result: {numerator: 2, denominator: 1}}, after: n('g', 2)}]);
        expect(valid(result)).toBe(true);
    });

    it('builds ordinary exact addition, including alternative equivalent replacement notation', () => {
        const expression: Node = {id: 's', kind: 'binary', operation: 'addition', left: n('a', 3, 2), right: n('b', 1, 2)};
        const result = build(expression, policy);
        expect(result.finalValue).toEqual({numerator: 2, denominator: 1});
        expect(result.powerFacts).toEqual([]);
        expect(result.reductions).toHaveLength(1);
        expect(result.precedenceWitness).toBeNull();
        expect(valid({...result, reductions: [{...result.reductions[0], after: {...n('s', 2),
            notation: {kind: 'fraction', numerator: 4, denominator: 2}}}]})).toBe(true);
    });

    it('retains true written-order and binding certificates without requiring a power', () => {
        const expression: Node = {id: 's', kind: 'binary', operation: 'addition',
            left: {id: 'left', kind: 'binary', operation: 'addition', left: n('a', 1), right: n('b', 2)},
            right: {id: 'm', kind: 'binary', operation: 'multiplication', left: n('c', 3), right: n('d', 4)}};
        const result = build(expression, policy);
        expect(result.reductions.map(step => step.targetNodeId)).toEqual(['m', 'left', 's']);
        expect(result.finalValue).toEqual({numerator: 15, denominator: 1});
        expect(result.precedenceWitness).not.toBeNull();
        expect(valid(result)).toBe(true);
        const product: Node = {id: 's', kind: 'binary', operation: 'addition',
            left: {id: 'm', kind: 'binary', operation: 'multiplication', left: n('a', 3), right: n('b', 1, 2)}, right: n('c', 2)};
        expect(build(product, policy).finalValue).toEqual({numerator: 7, denominator: 2});
        expect(build(product, policy).precedenceWitness!.reason).toBe('product-before-sum');
    });

    it('preserves strict package13 rejection of every no-power generic case and the error class', () => {
        for (const expression of [n('n', 1), {id: 'g', kind: 'group', expression: n('n', 1)} as const,
            {id: 's', kind: 'binary', operation: 'addition', left: n('a', 1), right: n('b', 2)} as const]) {
            const result = build(expression, policy);
            expect(valid(result)).toBe(true);
            expect(isNumericalPowerExpressionProblem({...result, kind: 'numerical-power-expression'})).toBe(false);
            expect(() => buildNumericalPowerExpressionProblem(expression, policy)).toThrow(GeneratorValidationError);
        }
        expect(isNumericalPowerExpressionProblem(Object.defineProperty({}, 'kind', {get() { throw new Error('malformed getter'); }}))).toBe(false);
    });

    it('rejects fabricated empty-case evidence, missing values, final-value forgery and undefined arithmetic', () => {
        const result = build(n('n', 1), policy);
        for (const bad of [null, {}, {...result, nodeValues: []}, {...result, finalValue: {numerator: 2, denominator: 1}},
            {...result, powerFacts: [{}]}, {...result, reductions: [{}]}, {...result, nodeValues: [{nodeId: 'n', value: {numerator: -0, denominator: 1}}]},
            {...result, precedenceWitness: {}}, {...result, reductions: new Array(0xffffffff)}]) expect(valid(bad)).toBe(false);
        const zeroDivision: Node = {id: 'd', kind: 'binary', operation: 'division', left: n('a', 1), right: n('b', 0)};
        expect(() => build(zeroDivision, policy)).toThrow(GeneratorValidationError);
        expect(valid({...result, expression: zeroDivision})).toBe(false);
    });
});
