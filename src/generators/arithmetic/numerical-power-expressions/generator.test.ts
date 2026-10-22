import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {ExactNumericalExpressionNode, SignedRational} from '../../../types/problems.ts';
import {isNumericalPowerExpressionProblem} from '../numerical-power-helpers.ts';
import {NumericalPowerExpressionsGenerator} from './generator.ts';

type Fraction = readonly [bigint, bigint];
const reduce = (n: bigint, d: bigint): Fraction => {
    let a = n < 0n ? -n : n, b = d < 0n ? -d : d;
    while (b) [a, b] = [b, a % b];
    return [n / a * (d < 0n ? -1n : 1n), (d < 0n ? -d : d) / a];
};
const asFraction = (value: SignedRational): Fraction => [BigInt(value.numerator), BigInt(value.denominator)];

/** Independent fraction oracle: it does not call the production evaluator or power builder. */
function evaluate(node: ExactNumericalExpressionNode): Fraction {
    if (node.kind === 'number') return asFraction(node.value);
    if (node.kind === 'group') return evaluate(node.expression);
    if (node.kind === 'negation') { const [n, d] = evaluate(node.operand); return [-n, d]; }
    if (node.kind === 'power') {
        const [n, d] = evaluate(node.base);
        return reduce(n ** BigInt(node.exponent), d ** BigInt(node.exponent));
    }
    const [a, b] = evaluate(node.left), [c, d] = evaluate(node.right);
    if (node.operation === 'addition') return reduce(a * d + c * b, b * d);
    if (node.operation === 'subtraction') return reduce(a * d - c * b, b * d);
    if (node.operation === 'multiplication') return reduce(a * c, b * d);
    return reduce(a * d, b * c);
}

function nodes(node: ExactNumericalExpressionNode): ExactNumericalExpressionNode[] {
    if (node.kind === 'binary') return [node, ...nodes(node.left), ...nodes(node.right)];
    if (node.kind === 'group') return [node, ...nodes(node.expression)];
    if (node.kind === 'power') return [node, ...nodes(node.base)];
    if (node.kind === 'negation') return [node, ...nodes(node.operand)];
    return [node];
}
function depth(node: ExactNumericalExpressionNode): number {
    if (node.kind === 'binary') return 1 + Math.max(depth(node.left), depth(node.right));
    if (node.kind === 'group') return 1 + depth(node.expression);
    if (node.kind === 'power') return 1 + depth(node.base);
    if (node.kind === 'negation') return 1 + depth(node.operand);
    return 1;
}

describe('real mathematical structure and exponent sampling', () => {
    it.each(['single-power', 'mixed-precedence'] as const)('constructs exact bounded %s mathematics in both exponent domains', structure => {
        const generator = new NumericalPowerExpressionsGenerator();
        for (const exponents of ['allow-zero', 'positive'] as const) {
            const features = new Set<string>();
            const shapes = new Set<string>();
            for (let seed = 0; seed < 192; seed++) {
                setSeed(seed);
                const stub = generator.generate({structure, exponents});
                const data = stub.data;
                expect(Object.keys(stub)).toEqual(['data']);
                expect(Object.keys(data).sort()).toEqual(['expression', 'finalValue', 'kind', 'nodeValues', 'powerFacts', 'precedenceWitness', 'reductions']);
                expect(isNumericalPowerExpressionProblem(data)).toBe(true);
                expect(asFraction(data.finalValue)).toEqual(evaluate(data.expression));
                const original = nodes(data.expression);
                expect(original.length).toBeLessThanOrEqual(25);
                expect(depth(data.expression)).toBeLessThanOrEqual(8);
                expect(new Set(original.map(node => node.id)).size).toBe(original.length);
                expect(data.nodeValues).toHaveLength(original.length);
                for (const node of original) {
                    const value = data.nodeValues.find(item => item.nodeId === node.id)!.value;
                    expect(asFraction(value)).toEqual(evaluate(node));
                    expect(BigInt(Math.abs(value.numerator)) <= 100n * BigInt(value.denominator)).toBe(true);
                    expect(Object.is(value.numerator, -0)).toBe(false);
                    if (node.kind === 'binary') features.add(node.operation);
                    if (node.kind === 'group') features.add('group');
                }
                for (const fact of data.powerFacts) {
                    expect(fact.exponent).toBeGreaterThanOrEqual(exponents === 'positive' ? 1 : 0);
                    expect(fact.exponent).toBeLessThanOrEqual(3);
                    if (fact.exponent === 0) { features.add('zero-exponent'); expect(fact.baseValue.numerator).not.toBe(0); }
                    if (fact.baseValue.numerator === 0) features.add('zero-base');
                    if (fact.baseValue.numerator < 0) features.add('negative-base');
                    if (fact.baseValue.denominator > 1) features.add('fraction-base');
                    if (fact.kind === 'positive-exponent') {
                        expect(fact.factors).toHaveLength(fact.exponent);
                        expect(fact.cumulativeProducts).toHaveLength(fact.exponent - 1);
                        for (const value of [...fact.factors, ...fact.cumulativeProducts]) {
                            expect(BigInt(Math.abs(value.numerator)) <= 100n * BigInt(value.denominator)).toBe(true);
                        }
                    }
                }
                if (structure === 'single-power') {
                    expect(data.expression.kind).toBe('power');
                    expect(data.powerFacts).toHaveLength(1);
                    expect(data.precedenceWitness).toBeNull();
                } else {
                    expect(data.precedenceWitness).not.toBeNull();
                    shapes.add(data.reductions.map(step => step.targetNodeId).join(','));
                    if (data.powerFacts.length === 2) features.add('two-powers');
                }
            }
            for (const required of ['negative-base', 'fraction-base', 'zero-base']) expect(features.has(required)).toBe(true);
            expect(features.has('zero-exponent')).toBe(exponents === 'allow-zero');
            if (structure === 'mixed-precedence') {
                for (const required of ['addition', 'subtraction', 'multiplication', 'division', 'group', 'two-powers']) expect(features.has(required)).toBe(true);
                expect(shapes.size).toBeGreaterThanOrEqual(6);
            }
        }
    });

    it('contains a true ready-left-addition precedence trap and preserves exact rational intermediates', () => {
        const generator = new NumericalPowerExpressionsGenerator();
        let trap = false, largeComponent = false, exactFraction = false;
        for (let seed = 0; seed < 192; seed++) {
            setSeed(seed);
            const {data} = generator.generate({structure: 'mixed-precedence', exponents: 'allow-zero'});
            const ids = data.reductions.map(step => step.targetNodeId);
            if (ids.includes('left-sum') && ids.includes('product') && data.powerFacts.length === 1) {
                expect(ids.indexOf('power')).toBeLessThan(ids.indexOf('product'));
                expect(ids.indexOf('product')).toBeLessThan(ids.indexOf('left-sum'));
                trap = true;
            }
            if (data.nodeValues.some(item => Math.abs(item.value.numerator) > 100 || item.value.denominator > 100)) largeComponent = true;
            if (data.nodeValues.some(item => item.value.denominator > 1)) exactFraction = true;
        }
        expect(trap).toBe(true);
        expect(largeComponent).toBe(true);
        expect(exactFraction).toBe(true);
    });

    it('replays exact data and rejects empty, missing or false mathematical config', () => {
        const generator = new NumericalPowerExpressionsGenerator();
        const config = {structure: 'mixed-precedence', exponents: 'positive'} as const;
        setSeed(31); const first = generator.generate(config);
        setSeed(31); expect(generator.generate(config)).toEqual(first);
        for (const value of [null, undefined, {}, {structure: 'single-power'}, {exponents: 'positive'},
            {...config, structure: 'write'}, {...config, structure: []}, {...config, exponents: 'negative'}, {...config, exponents: false}]) {
            expect(() => generator.generate(value as never)).toThrow(GeneratorValidationError);
        }
    });
});
