import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {AffineExpression, AlgebraExpressionEquivalenceProblem, AlgebraicScalar, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {isAlgebraExpressionEquivalenceProblem} from '../algebra-equivalence-helpers.ts';
import {AlgebraExpressionEquivalenceGenerator} from './generator.ts';

type Fraction = readonly [bigint, bigint];
const reduced = (n: bigint, d: bigint): Fraction => {
    let a = n < 0n ? -n : n, b = d < 0n ? -d : d;
    while (b) [a, b] = [b, a % b];
    return [n / a * (d < 0n ? -1n : 1n), (d < 0n ? -d : d) / a];
};
const fraction = (value: AlgebraicScalar): Fraction => [BigInt(value.numerator), BigInt(value.denominator)];
/** Independent exact evaluator for construction checks, never used as an identity proof. */
function evaluate(node: Node, inputs: ReadonlyMap<string, Fraction>): Fraction {
    if (node.kind === 'number') return fraction(node.value);
    if (node.kind === 'variable') return inputs.get(node.symbolId)!;
    if (node.kind === 'group') return evaluate(node.expression, inputs);
    if (node.kind === 'negation') { const [n, d] = evaluate(node.operand, inputs); return [-n, d]; }
    if (node.kind === 'power') throw new Error('Powers are outside the reviewed affine identity grammar.');
    const [a, b] = evaluate(node.left, inputs), [c, d] = evaluate(node.right, inputs);
    if (node.operation === 'addition') return reduced(a * d + c * b, b * d);
    if (node.operation === 'subtraction') return reduced(a * d - c * b, b * d);
    if (node.operation === 'multiplication') return reduced(a * c, b * d);
    return reduced(a * d, b * c);
}
const expression = (data: AlgebraExpressionEquivalenceProblem, id: string): AffineExpression => data.expressions.find(item => item.expressionId === id)!;

describe('real affine identities and same-source comparisons', () => {
    it.each(['distribution', 'collection', 'association', 'commutation', 'normalization'] as const)('constructs universally witnessed %s with both valid and invalid candidate mathematics', relation => {
        const generator = new AlgebraExpressionEquivalenceGenerator(), shapes = new Set<string>(), comparisons = new Set<string>(), features = new Set<string>();
        for (let seed = 0; seed < 64; seed++) {
            setSeed(seed);
            const stub = generator.generate({relation}), data = stub.data;
            expect(Object.keys(stub)).toEqual(['data']);
            expect(isAlgebraExpressionEquivalenceProblem(data)).toBe(true);
            expect(data.comparison.sourceExpressionId).toBe(data.validIdentity.sourceExpressionId);
            const source = expression(data, data.validIdentity.sourceExpressionId), rewritten = expression(data, data.validIdentity.equivalentExpressionId);
            expect(source.root).not.toEqual(rewritten.root);
            expect(data.validIdentity.universalProof.leftNormalization.rootNormalForm).toEqual(data.validIdentity.universalProof.rightNormalization.rootNormalForm);
            const rule = data.validIdentity.steps[0];
            expect(rule.kind).toBe(relation === 'normalization' ? 'coefficient-normalization' : relation);
            if (rule.kind === 'distribution') features.add(rule.direction);
            if (rule.kind === 'association') { features.add(rule.operation); features.add(rule.beforeGrouping); features.add(rule.afterGrouping); }
            if (rule.kind === 'commutation') features.add(rule.operation);
            if (rule.kind === 'collection' && rule.collectedCoefficient.numerator === 0) features.add('zero-cancellation');
            for (const input of [-2, 0, 1, 3]) {
                const bindings = new Map(data.domain.symbols.map((symbol, index) => [symbol.symbolId, [BigInt(input + index), 2n] as Fraction]));
                expect(evaluate(source.root, bindings)).toEqual(evaluate(rewritten.root, bindings));
            }
            if (data.comparison.kind === 'not-equivalent') {
                const witness = data.comparison.counterexample;
                expect(witness.bindings).toHaveLength(data.domain.symbols.length);
                const bindings = new Map(witness.bindings.map(binding => [binding.symbolId, fraction(binding.value)]));
                const actualLeft = evaluate(source.root, bindings), actualRight = evaluate(expression(data, data.comparison.candidateExpressionId).root, bindings);
                expect(actualLeft).not.toEqual(actualRight);
                expect(actualLeft).toEqual(fraction(witness.unequalValues.left));
                expect(actualRight).toEqual(fraction(witness.unequalValues.right));
                if (data.comparison.differingComponent.symbolId === null) features.add('constant-disproof'); else features.add('coefficient-disproof');
            }
            for (const symbol of data.domain.symbols) expect(symbol.domain).toEqual({kind: 'rational', lower: null, upper: null, excludedValues: []});
            comparisons.add(data.comparison.kind);
            shapes.add(JSON.stringify(source.root));
        }
        expect(comparisons).toEqual(new Set(['equivalent', 'not-equivalent']));
        expect(features.has('constant-disproof')).toBe(true);
        expect(features.has('coefficient-disproof')).toBe(true);
        expect(shapes.size).toBeGreaterThan(6);
        if (relation === 'distribution') expect(features).toEqual(new Set(['constant-disproof', 'coefficient-disproof', 'factored-to-expanded', 'expanded-to-factored']));
        if (relation === 'association' || relation === 'commutation') for (const operation of ['addition', 'multiplication']) expect(features.has(operation)).toBe(true);
        if (relation === 'collection') expect(features.has('zero-cancellation')).toBe(true);
    });

    it('retains a canceled symbol domain and distinguishes finite agreement from an identity', () => {
        const generator = new AlgebraExpressionEquivalenceGenerator();
        let canceled = false, finiteAgreement = false, bareVariables = false;
        for (let seed = 0; seed < 128; seed++) {
            setSeed(seed);
            const data = generator.generate({relation: 'collection'}).data;
            const rewritten = expression(data, data.validIdentity.equivalentExpressionId);
            if (rewritten.root.kind === 'number') { canceled = true; expect(data.domain.symbols[0].symbolId).toBe('y'); expect(rewritten.root.value.numerator).toBe(0); }
            const source = expression(data, data.validIdentity.sourceExpressionId);
            if (!JSON.stringify(source.root).includes('"kind":"number"')) {
                bareVariables = true;
                expect(data.validIdentity.universalProof.leftNormalization.steps.filter(step => step.kind === 'variable')
                    .every(step => step.kind === 'variable' && step.unitCoefficient.numerator === 1)).toBe(true);
            }
            if (data.comparison.kind === 'not-equivalent' && data.comparison.differingComponent.symbolId !== null) {
                finiteAgreement = true;
                const zero = new Map(data.domain.symbols.map(symbol => [symbol.symbolId, [0n, 1n] as Fraction]));
                expect(evaluate(source.root, zero)).toEqual(evaluate(expression(data, data.comparison.candidateExpressionId).root, zero));
            }
        }
        expect([canceled, finiteAgreement, bareVariables]).toEqual([true, true, true]);
    });

    it('replays exactly and rejects missing or invented task/profile config', () => {
        const generator = new AlgebraExpressionEquivalenceGenerator();
        setSeed(23); const first = generator.generate({relation: 'association'});
        setSeed(23); expect(generator.generate({relation: 'association'})).toEqual(first);
        for (const config of [null, undefined, {}, {relation: []}, {relation: 'judge'}, {relation: false}, {relation: 'distribution-and-collection'}]) {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });
});
