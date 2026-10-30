import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {extractConfig} from '../../../lib/utils.ts';
import type {ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {AlgebraExpressionsGenerator} from './generator.ts';
import {inputsMeetNumericProfile, numericProfileBundles, profilesForRelation, resolveNumericProfile} from './numeric-profiles.ts';
import {AlgebraExpressionsGeneratorSchema as schema} from './spec.ts';

const numericRelations = ['numeric-terms', 'numeric-factors', 'numeric-sum', 'numeric-product',
    'numeric-quotient', 'numeric-grouped'] as const;
type Rational = readonly [bigint, bigint];
const reduce = (n: bigint, d: bigint): Rational => {
    const sign = d < 0n ? -1n : 1n;
    let a = n < 0n ? -n : n, b = d < 0n ? -d : d;
    while (b) [a, b] = [b, a % b];
    return [n * sign / a, d * sign / a];
};
/** Independent exact values of every visible numeric occurrence and consequence. */
function values(node: Node): Rational[] {
    if (node.kind === 'number') return [[BigInt(node.value.numerator), BigInt(node.value.denominator)]];
    if (node.kind === 'variable') throw new Error('A numeric frame must expose every substituted value');
    if (node.kind === 'group') return values(node.expression);
    if (node.kind === 'negation') {
        const child = values(node.operand), [n, d] = child[0]!;
        return [[-n, d], ...child];
    }
    if (node.kind === 'power') throw new Error('Structural numeric frames have no powers');
    const left = values(node.left), right = values(node.right), [a, b] = left[0]!, [c, d] = right[0]!;
    const result = node.operation === 'addition' ? reduce(a * d + c * b, b * d)
        : node.operation === 'subtraction' ? reduce(a * d - c * b, b * d)
            : node.operation === 'multiplication' ? reduce(a * c, b * d) : reduce(a * d, b * c);
    return [result, ...left, ...right];
}

describe('algebra numeric-frame and visible-domain profiles', () => {
    it('partitions every original finite parameter path and establishes the retry bound exhaustively', () => {
        for (const relation of numericRelations) {
            const domain = profilesForRelation(relation), counts = new Map(domain.map(profile => [profile, 0]));
            let total = 0;
            for (let a = 2; a <= 9; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 5; c++) {
                for (let n = -8; n <= 8; n++) for (let d = 1; d <= 4; d++) {
                    const inputs = {a, b, c, input: {numerator: n, denominator: d}};
                    const admitted = domain.filter(profile => inputsMeetNumericProfile(relation, inputs, profile));
                    if (admitted.length !== 1) throw new Error(`Nonunique partition: ${relation}/${JSON.stringify(inputs)}`);
                    counts.set(admitted[0], counts.get(admitted[0])! + 1); total++;
                }
            }
            expect(total).toBe(16320);
            for (const count of counts.values()) expect(count / total).toBeGreaterThanOrEqual(1 / 100);
        }
    });

    it('guarantees its claims over full visible numeric expressions including signed additive components', () => {
        const generator = new AlgebraExpressionsGenerator();
        for (const relation of numericRelations) for (const numericProfile of profilesForRelation(relation)) {
            for (let seed = 0; seed < 24; seed++) {
                setSeed(seed);
                const {data} = generator.generate({relation, power: 'none', numericProfile})!;
                const participating = values(data.structuralExpression.expression);
                const primary = data.structuralRelations[0];
                if (primary.kind === 'additive-components') {
                    for (const term of primary.terms) participating.push(...values(term.signedExpression));
                }
                expect(participating.some(([n]) => n < 0n)).toBe(numericProfile > 2);
                expect(participating.some(([n]) => n === 0n)).toBe(numericProfile % 2 === 0);
            }
        }
    });

    it('uses the writer visible rational domain and its explicit zero restriction instead of a hidden assignment', () => {
        const generator = new AlgebraExpressionsGenerator();
        for (const numericProfile of [3, 4] as const) for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const {data} = generator.generate({relation: 'plain', power: 'none', numericProfile})!;
            expect(data.symbols[0].domain).toEqual({kind: 'rational', lower: null, upper: null, excludedValues: []});
            expect(data.expression.kind === 'binary' && data.expression.operation === 'division').toBe(numericProfile === 3);
            expect(data.restrictions.length).toBe(numericProfile === 3 ? 1 : 0);
        }
    });

    it('keeps every symbolic configuration on its original unrestricted profile without reading hidden bindings', () => {
        for (const relation of ['symbolic-terms', 'symbolic-factors', 'symbolic-coefficient', 'symbolic-sum',
            'symbolic-product', 'symbolic-quotient', 'symbolic-grouped']) {
            expect(profilesForRelation(relation)).toEqual([0]);
        }
        expect(resolveNumericProfile([Area.AlgebraicExpression, Area.Term])).toBe(0);
        expect(resolveNumericProfile([Area.AlgebraicExpression, Area.Term, ...numericProfileBundles[0]])).toBeUndefined();
        const unresolved = extractConfig(schema, [Area.AlgebraicExpression, Area.Term]);
        expect(unresolved.config.numericProfile).toBe(0);
        expect(unresolved.resolvedLabels).not.toContain(Scope.NumbersWithoutZero);
        expect(unresolved.resolvedLabels).not.toContain(Scope.NumbersWithZero);
    });

    it('admits only zero absence for a symbolic quotient and does not infer a sign', () => {
        const quotient = [Area.AlgebraicExpression, Area.Division];
        expect(resolveNumericProfile([Scope.NumbersWithoutZero])).toBe(0);
        expect(resolveNumericProfile(quotient)).toBeUndefined();
        expect(resolveNumericProfile([...quotient, Scope.NumbersWithoutZero])).toBe(0);
        for (const claims of [[Scope.NumbersWithZero], [Scope.NumbersWithNegatives],
            [Scope.NumbersWithoutNegatives], ...numericProfileBundles]) {
            expect(resolveNumericProfile([...quotient, ...claims])).toBeUndefined();
        }
        for (const context of [[Area.AlgebraicExpression, Area.Term],
            [Area.AlgebraicExpression, Scope.RationalNumbers],
            [Area.ArithmeticExpression, Area.Division, Scope.RationalNumbers],
            [Area.AlgebraicExpression, Area.NumericSubstitution],
            [Area.AlgebraicExpression, Area.AlgebraicModeling]]) {
            expect(resolveNumericProfile([...context, Scope.NumbersWithoutZero])).toBeUndefined();
        }
        setSeed('pure-symbolic-quotient'); const state = getRandomState();
        expect(resolveNumericProfile([...quotient, Scope.NumbersWithoutZero])).toBe(0);
        expect(getRandomState()).toBe(state);
    });

    it('resolves purely and rejects a missing or incompatible mathematical profile', () => {
        setSeed('pure-algebra-profile'); const state = getRandomState();
        expect(resolveNumericProfile([Area.ArithmeticExpression, Area.Addition, ...numericProfileBundles[0]])).toBe(1);
        expect(getRandomState()).toBe(state);
        const generator = new AlgebraExpressionsGenerator();
        expect(() => generator.generate({relation: 'numeric-sum', power: 'none'})).toThrow(/numericProfile/);
        expect(() => generator.generate({relation: 'numeric-quotient', power: 'none', numericProfile: 2})).toThrow();
        expect(() => generator.generate({relation: 'symbolic-sum', power: 'none', numericProfile: 1})).toThrow();
    });
});
