import {afterEach, describe, expect, it, vi} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import * as randomness from '../../../lib/random.ts';
import type {AlgebraicExpressionProblem, AlgebraicScalar, ExactSymbolicExpressionNode} from '../../../types/problems.ts';
import {isAlgebraicExpressionProblem} from '../algebra-expression-helpers.ts';
import {AlgebraExpressionsGenerator} from './generator.ts';
import type {AlgebraExpressionsGeneratorConfig} from './spec.ts';
import {profilesForRelation} from './numeric-profiles.ts';
import {numericExpressionCaseCount, numericExpressionInputsAt, numericExpressionRangeProfiles} from './numeric-domain.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

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
    afterEach(() => vi.restoreAllMocks());
    it.each(relations)('constructs a coherent uniform %s relation with exact independent evaluation', relation => {
        const generator = new AlgebraExpressionsGenerator();
        const examples = new Set<string>();
        for (let seed = 0; seed < 48; seed++) {
            setSeed(seed);
            const profiles = profilesForRelation(relation);
            const numericProfile = profiles[seed % profiles.length]!;
            const ranges = numericExpressionRangeProfiles.filter(profile => numericExpressionCaseCount(relation, numericProfile, profile.range));
            const stub = generator.generate({relation, power: 'none', numericProfile,
                range: relation.startsWith('numeric-') ? ranges[seed % ranges.length]!.range : false})!, data = stub.data;
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
            const coefficient = generator.generate({relation: 'symbolic-coefficient', power: 'none', numericProfile: 0})!.data.structuralRelations[0];
            expect(coefficient.kind).toBe('coefficient');
            if (coefficient.kind === 'coefficient') {
                coefficients.add(coefficient.coefficient.numerator);
                expect(coefficient.variableSymbolIds).toEqual(['x']);
                if (!coefficient.constantFactors.length) features.add('implicit-coefficient');
            }
            for (const power of ['none', 'allow-zero', 'positive'] as const) {
                setSeed(seed);
                const data = generator.generate({relation: 'substitution', power, numericProfile: 0})!.data;
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
        const generator = new AlgebraExpressionsGenerator(), config = {relation: 'substitution', power: 'positive', numericProfile: 0} as const;
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
        const plainDivision = generator.generate({relation: 'plain', power: 'none', numericProfile: 3})!.data;
        expect(plainDivision.expression.kind === 'binary' && plainDivision.expression.operation).toBe('division');
        expect(plainDivision.substitution.bindings[0].value).toEqual({numerator: 1, denominator: 2});
        const range = createCanonicalNumericRange(5);
        const count = numericExpressionCaseCount('numeric-quotient', 3, range);
        const zeroTicket = Array.from({length: count}, (_, index) => index)
            .find(index => numericExpressionInputsAt('numeric-quotient', 3, range, index).input.numerator === 0)!;
        const draw = vi.spyOn(randomness, 'random').mockReturnValueOnce((zeroTicket + 0.5) / count);
        const quotient = generator.generate({relation: 'numeric-quotient', power: 'none', numericProfile: 3, range})!.data;
        draw.mockRestore();
        expect(quotient.substitution.bindings[0].value).toEqual({numerator: -1, denominator: 2});
        setSeed(54);
        const ordinary = generator.generate({relation: 'plain', power: 'none', numericProfile: 4})!.data;
        expect(ordinary.substitution.bindings[0].value.numerator).toBe(0);
        expect(ordinary.restrictions).toEqual([]);
        expect(ordinary.symbols[0].domain.excludedValues).toEqual([]);
    });

    it('preserves both original writer conditional samplers after moving their equal mixture into mathematics', () => {
        const generator = new AlgebraExpressionsGenerator();
        const originalDraw = randomness.random;
        for (const numericProfile of [3, 4] as const) for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const original = generator.generate({relation: 'plain', power: 'none', numericProfile});
            const continuation = randomness.getRandomState();
            setSeed(seed);
            // Hold the private mixture choice fixed to compare the complete
            // subsequent raw stream with the original conditional sampler.
            const draw = vi.spyOn(randomness, 'random').mockImplementation(originalDraw)
                .mockImplementationOnce(() => numericProfile === 3 ? 0.25 : 0.75);
            expect(generator.generate({relation: 'plain', power: 'none', numericProfile: 0})).toEqual(original);
            expect(randomness.getRandomState()).toBe(continuation);
            draw.mockRestore();
        }
    });

    it('retains the original numeric term frame with its unused zero subtotal under the supported negative/nonzero profile', () => {
        const range = createCanonicalNumericRange(5), count = numericExpressionCaseCount('numeric-terms', 3, range);
        const ticket = Array.from({length: count}, (_, index) => index).find(index => {
            const inputs = numericExpressionInputsAt('numeric-terms', 3, range, index);
            return inputs.a === 2 && inputs.b === 2 && inputs.c === 4 && inputs.input.numerator === -3 && inputs.input.denominator === 2;
        })!;
        vi.spyOn(randomness, 'random').mockReturnValueOnce((ticket + 0.5) / count);
        const data = new AlgebraExpressionsGenerator().generate({relation: 'numeric-terms', power: 'none', numericProfile: 3, range})!.data;
        const expression = data.structuralExpression.expression;
        expect(nodes(expression).filter(node => node.kind === 'number').map(node => fraction(node.value)))
            .toEqual([[2n, 1n], [-3n, 2n], [2n, 1n], [-3n, 2n], [4n, 1n]]);
        expect(expression.kind).toBe('binary');
        if (expression.kind !== 'binary') throw new Error('Expected the original sum');
        expect(evaluate(expression.left, data.substitution.bindings)).toEqual([0n, 1n]);
        expect(evaluate(expression, data.substitution.bindings)).toEqual([4n, 1n]);
        const terms = data.structuralRelations[0];
        expect(terms.kind).toBe('additive-components');
        if (terms.kind !== 'additive-components') throw new Error('Expected the original terms');
        expect(terms.terms.map(term => evaluate(term.signedExpression, data.substitution.bindings))).toEqual([[-3n, 1n], [3n, 1n], [4n, 1n]]);
    });

    it('selects division on exactly the lower half of the private writer draw domain', () => {
        const generator = new AlgebraExpressionsGenerator(), originalDraw = randomness.random;
        for (const mixtureDraw of [0, 0.25, 0.5, 0.75, 1 - 2 ** -32]) {
            setSeed(17);
            const draw = vi.spyOn(randomness, 'random').mockImplementation(originalDraw).mockReturnValueOnce(mixtureDraw);
            const data = generator.generate({relation: 'plain', power: 'none', numericProfile: 0})!.data;
            expect(data.expression.kind === 'binary' && data.expression.operation === 'division').toBe(mixtureDraw < 0.5);
            draw.mockRestore();
        }
    });
});
