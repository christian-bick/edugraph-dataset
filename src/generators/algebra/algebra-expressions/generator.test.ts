import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {AlgebraicExpressionProblem, AlgebraicScalar, ExactSymbolicExpressionNode} from '../../../types/problems.ts';
import {isAlgebraicExpressionProblem} from '../algebra-expression-helpers.ts';
import {AlgebraExpressionsGenerator} from './generator.ts';
import type {AlgebraExpressionsGeneratorConfig} from './spec.ts';

type Fraction = readonly [bigint, bigint];
const reduced = (numerator: bigint, denominator: bigint): Fraction => {
    let a = numerator < 0n ? -numerator : numerator, b = denominator < 0n ? -denominator : denominator;
    while (b) [a, b] = [b, a % b];
    return [numerator / a * (denominator < 0n ? -1n : 1n), (denominator < 0n ? -denominator : denominator) / a];
};
const fraction = (n: AlgebraicScalar): Fraction => [BigInt(n.numerator), BigInt(n.denominator)];
/** Independent BigInt oracle substitutes the original symbolic tree directly. */
function evaluate(node: ExactSymbolicExpressionNode, bindings: AlgebraicExpressionProblem['substitution']['bindings']): Fraction {
    if (node.kind === 'number') return fraction(node.value);
    if (node.kind === 'variable') return fraction(bindings.find(binding => binding.symbolId === node.symbolId)!.value);
    if (node.kind === 'group') return evaluate(node.expression, bindings);
    if (node.kind === 'negation') { const [n, d] = evaluate(node.operand, bindings); return [-n, d]; }
    if (node.kind === 'power') { const [n, d] = evaluate(node.base, bindings); return reduced(n ** BigInt(node.exponent), d ** BigInt(node.exponent)); }
    const [a, b] = evaluate(node.left, bindings), [c, d] = evaluate(node.right, bindings);
    if (node.operation === 'addition') return reduced(a * d + c * b, b * d);
    if (node.operation === 'subtraction') return reduced(a * d - c * b, b * d);
    if (node.operation === 'multiplication') return reduced(a * c, b * d);
    return reduced(a * d, b * c);
}
function nodes(node: ExactSymbolicExpressionNode): ExactSymbolicExpressionNode[] {
    if (node.kind === 'binary') return [node, ...nodes(node.left), ...nodes(node.right)];
    if (node.kind === 'group') return [node, ...nodes(node.expression)];
    if (node.kind === 'negation') return [node, ...nodes(node.operand)];
    if (node.kind === 'power') return [node, ...nodes(node.base)];
    return [node];
}
const relations: NonNullable<AlgebraExpressionsGeneratorConfig['relation']>[] = ['plain', 'numeric-terms', 'symbolic-terms', 'numeric-factors',
    'symbolic-factors', 'symbolic-coefficient', 'numeric-sum', 'symbolic-sum', 'numeric-product', 'symbolic-product',
    'numeric-quotient', 'symbolic-quotient', 'numeric-grouped', 'symbolic-grouped', 'substitution', 'modeling'];

describe('canonical algebra expression mathematics', () => {
    it.each(relations)('constructs a coherent uniform %s relation with exact independent evaluation', relation => {
        const generator = new AlgebraExpressionsGenerator();
        const examples = new Set<string>();
        for (let seed = 0; seed < 48; seed++) {
            setSeed(seed);
            const stub = generator.generate({relation, power: 'none'}), data = stub.data;
            expect(Object.keys(stub)).toEqual(['data']);
            expect(isAlgebraicExpressionProblem(data)).toBe(true);
            expect(fraction(data.substitution.finalValue)).toEqual(evaluate(data.expression, data.substitution.bindings));
            expect(data.structuralExpression.kind).toBe(relation.startsWith('numeric-') ? 'numeric' : 'symbolic');
            expect(data.substitution.powerFacts).toEqual([]);
            expect(data.groupedOperands.length).toBeGreaterThan(0);
            for (const binding of data.substitution.bindings) {
                expect(new Set(binding.occurrenceNodeIds)).toEqual(new Set(nodes(data.expression)
                    .filter(node => node.kind === 'variable' && node.symbolId === binding.symbolId).map(node => node.id)));
            }
            if (relation.endsWith('-terms')) {
                expect(data.structuralRelations[0].kind).toBe('additive-components');
                const fact = data.structuralRelations[0];
                if (fact.kind === 'additive-components') { expect(fact.terms).toHaveLength(3); expect(fact.terms[1].polarity).toBe(-1); }
            }
            if (relation.endsWith('-factors')) expect(data.structuralRelations[0].kind).toBe('multiplicative-components');
            if (relation.endsWith('-sum')) expect(data.structuralRelations[0].kind).toBe('sum');
            if (relation.endsWith('-product')) expect(data.structuralRelations[0].kind).toBe('product');
            if (relation.endsWith('-quotient')) {
                expect(data.structuralRelations[0].kind).toBe('quotient');
                expect(data.restrictions).toEqual([{kind: 'nonzero-expression', expressionNodeId: 'input-group', reason: 'division-denominator'}]);
            }
            if (relation.endsWith('-grouped')) {
                const fact = data.groupedOperands[0];
                expect(nodes(data.structuralExpression.expression).find(node => node.id === fact.innerNodeId)?.kind).toBe('binary');
            }
            if (relation === 'substitution') expect(data.substitution.precedenceWitness).not.toBeNull();
            if (relation === 'modeling') {
                expect(data.context.kind).toBe('quantitative-system');
                if (data.context.kind === 'quantitative-system') {
                    const context = data.context;
                    expect(context.relations[0].kind).toBe('fixed-and-proportional');
                    expect(context.quantities.find(quantity => quantity.quantityId === context.outputQuantityId)?.expression).toEqual(data.expression);
                    expect(data.symbols[0].domain.lower).toEqual({value: {numerator: 0, denominator: 1}, inclusive: true});
                }
            } else expect(data.context.kind).toBe('parameter-description');
            examples.add(JSON.stringify(data.expression));
        }
        expect(examples.size).toBeGreaterThan(6);
    });

    it('samples signed rational repeated substitutions, implicit/negative/zero coefficients, and locally admissible powers', () => {
        const generator = new AlgebraExpressionsGenerator();
        const coefficients = new Set<number>(), features = new Set<string>();
        for (let seed = 0; seed < 160; seed++) {
            setSeed(seed);
            const coefficient = generator.generate({relation: 'symbolic-coefficient', power: 'none'}).data.structuralRelations[0];
            expect(coefficient.kind).toBe('coefficient');
            if (coefficient.kind === 'coefficient') {
                coefficients.add(coefficient.coefficient.numerator);
                expect(coefficient.variableSymbolIds).toEqual(['x']);
                if (!coefficient.constantFactors.length) features.add('implicit-coefficient');
            }
            for (const power of ['none', 'allow-zero', 'positive'] as const) {
                setSeed(seed);
                const data = generator.generate({relation: 'substitution', power}).data;
                expect(isAlgebraicExpressionProblem(data)).toBe(true);
                expect(fraction(data.substitution.finalValue)).toEqual(evaluate(data.expression, data.substitution.bindings));
                expect(data.substitution.bindings[0].occurrenceNodeIds).toHaveLength(2);
                expect(data.substitution.precedenceWitness).not.toBeNull();
                if (data.substitution.bindings[0].value.denominator > 1) features.add('fraction-input');
                if (data.substitution.bindings[0].value.numerator < 0) features.add('negative-input');
                for (const fact of data.substitution.powerFacts) {
                    expect(fact.exponent).toBeGreaterThanOrEqual(power === 'positive' ? 1 : 0);
                    if (fact.exponent === 0) { features.add('zero-exponent'); expect(fact.baseValue.numerator).not.toBe(0); }
                }
                expect(data.substitution.powerFacts).toHaveLength(power === 'none' ? 0 : 1);
            }
        }
        expect(coefficients).toEqual(new Set([-3, -1, 0, 1, 2, 5]));
        expect(features).toEqual(new Set(['implicit-coefficient', 'fraction-input', 'negative-input', 'zero-exponent']));
    });

    it('replays exact payloads and rejects missing, unsupported, or incompatible mathematical config', () => {
        const generator = new AlgebraExpressionsGenerator(), config = {relation: 'substitution', power: 'positive'} as const;
        setSeed(17); const first = generator.generate(config);
        setSeed(17); expect(generator.generate(config)).toEqual(first);
        for (const invalid of [null, undefined, {}, {relation: 'plain'}, {power: 'none'}, {...config, relation: 'evaluate'},
            {...config, power: 'negative'}, {...config, power: false}, {relation: 'modeling', power: 'positive'}, {relation: 'plain', power: 'allow-zero'}]) {
            expect(() => generator.generate(invalid as never)).toThrow(GeneratorValidationError);
        }
    });

    it('excludes zero only at a division denominator and retains zero in ordinary parameter domains', () => {
        const generator = new AlgebraExpressionsGenerator();
        setSeed(70);
        const plainDivision = generator.generate({relation: 'plain', power: 'none'}).data;
        expect(plainDivision.expression.kind === 'binary' && plainDivision.expression.operation).toBe('division');
        expect(plainDivision.substitution.bindings[0].value).toEqual({numerator: 1, denominator: 2});
        setSeed(54);
        const quotient = generator.generate({relation: 'numeric-quotient', power: 'none'}).data;
        expect(quotient.substitution.bindings[0].value).toEqual({numerator: -1, denominator: 2});
        setSeed(54);
        const ordinary = generator.generate({relation: 'plain', power: 'none'}).data;
        expect(ordinary.substitution.bindings[0].value.numerator).toBe(0);
        expect(ordinary.restrictions).toEqual([]);
        expect(ordinary.symbols[0].domain.excludedValues).toEqual([]);
    });
});
