import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {extractConfig} from '../../../lib/utils.ts';
import type {ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {AlgebraExpressionsGenerator} from './generator.ts';
import {inputsMeetNumericProfile, numericProfileBundles, profilesForRelation, resolveNumericProfile,
    type ExpressionInputs, type AlgebraNumericProfile} from './numeric-profiles.ts';
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
/** Read displayed literals without evaluating the expression being classified. */
function literals(node: Node): Rational[] {
    if (node.kind === 'number') return [[BigInt(node.value.numerator), BigInt(node.value.denominator)]];
    if (node.kind === 'variable') throw new Error('A numeric frame must expose every substituted value');
    if (node.kind === 'group') return literals(node.expression);
    if (node.kind === 'negation') return literals(node.operand);
    if (node.kind === 'power') throw new Error('Structural numeric frames have no powers');
    return [...literals(node.left), ...literals(node.right)];
}

/** Evaluate only a complete signed component whose structural role is assessed. */
function signedComponent(node: Node): Rational {
    if (node.kind === 'number') return [BigInt(node.value.numerator), BigInt(node.value.denominator)];
    if (node.kind === 'variable' || node.kind === 'power') throw new Error('Expected a numeric signed term');
    if (node.kind === 'group') return signedComponent(node.expression);
    if (node.kind === 'negation') { const [n, d] = signedComponent(node.operand); return [-n, d]; }
    const [a, b] = signedComponent(node.left), [c, d] = signedComponent(node.right);
    return node.operation === 'addition' ? reduce(a * d + c * b, b * d)
        : node.operation === 'subtraction' ? reduce(a * d - c * b, b * d)
            : node.operation === 'multiplication' ? reduce(a * c, b * d) : reduce(a * d, b * c);
}

/** Frozen pre-correction evidence boundary for the approved old-support migration proof. */
function previousProfile(relation: string, inputs: ExpressionInputs): AlgebraNumericProfile {
    const {a, b, c} = inputs;
    let {numerator: n, denominator: d} = inputs.input;
    if (relation === 'numeric-quotient' && n === 0) { n = -1; d = 2; }
    const quantities = relation === 'numeric-terms' ? [a, b, c, n, a * n, b * n,
        (a - b) * n, (a - b) * n + c * d, -b * n]
        : relation === 'numeric-sum' ? [a, n, a * d + n]
            : relation === 'numeric-quotient' ? [a, n, n < 0 ? -a * d : a * d]
                : [a, b, n, n + b * d, a * (n + b * d)];
    return ((quantities.some(value => value < 0) ? 3 : 1) + Number(quantities.includes(0))) as AlgebraNumericProfile;
}

const expectedPartitions = {
    'numeric-terms': {before: {2: 960, 3: 13364, 4: 1996}, after: {2: 960, 3: 15360}},
    'numeric-factors': {before: {1: 7680, 2: 960, 3: 7120, 4: 560}, after: {1: 7680, 2: 960, 3: 7680}},
    'numeric-sum': {before: {1: 7680, 2: 960, 3: 7320, 4: 360}, after: {1: 7680, 2: 960, 3: 7680}},
    'numeric-product': {before: {1: 7680, 2: 960, 3: 7120, 4: 560}, after: {1: 7680, 2: 960, 3: 7680}},
    'numeric-quotient': {before: {1: 7680, 3: 8640}, after: {1: 7680, 3: 8640}},
    'numeric-grouped': {before: {1: 7680, 2: 960, 3: 7120, 4: 560}, after: {1: 7680, 2: 960, 3: 7680}}
} as const;

describe('algebra numeric-frame and visible-domain profiles', () => {
    it('retains all97920 original raw paths, moving only the five old negative/zero classes into negative/nonzero', () => {
        let completeDomain = 0;
        for (const relation of numericRelations) {
            const domain = profilesForRelation(relation), counts = new Map(domain.map(profile => [profile, 0]));
            const beforeCounts: Record<number, number> = {};
            let total = 0;
            for (let a = 2; a <= 9; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 5; c++) {
                for (let n = -8; n <= 8; n++) for (let d = 1; d <= 4; d++) {
                    const inputs = {a, b, c, input: {numerator: n, denominator: d}};
                    const admitted = domain.filter(profile => inputsMeetNumericProfile(relation, inputs, profile));
                    if (admitted.length !== 1) throw new Error(`Nonunique partition: ${relation}/${JSON.stringify(inputs)}`);
                    const before = previousProfile(relation, inputs);
                    if (admitted[0] !== (before === 4 ? 3 : before)) throw new Error(`Changed an unapproved class: ${relation}/${JSON.stringify(inputs)}`);
                    beforeCounts[before] = (beforeCounts[before] ?? 0) + 1;
                    counts.set(admitted[0], counts.get(admitted[0])! + 1); total++;
                }
            }
            expect(total).toBe(16320);
            completeDomain += total;
            expect(beforeCounts).toEqual(expectedPartitions[relation].before);
            expect(Object.fromEntries(counts)).toEqual(expectedPartitions[relation].after);
            for (const count of counts.values()) expect(count / total).toBeGreaterThanOrEqual(1 / 100);
        }
        expect(completeDomain).toBe(97920);
    });

    it('guarantees its claims over displayed literals and the complete signed additive components', () => {
        const generator = new AlgebraExpressionsGenerator();
        for (const relation of numericRelations) for (const numericProfile of profilesForRelation(relation)) {
            for (let seed = 0; seed < 24; seed++) {
                setSeed(seed);
                const {data} = generator.generate({relation, power: 'none', numericProfile})!;
                const participating = literals(data.structuralExpression.expression);
                const primary = data.structuralRelations[0];
                if (primary.kind === 'additive-components') {
                    for (const term of primary.terms) participating.push(signedComponent(term.signedExpression));
                }
                expect(participating.some(([n]) => n < 0n)).toBe(numericProfile > 2);
                expect(participating.some(([n]) => n === 0n)).toBe(numericProfile % 2 === 0);
            }
        }
    });

    it('ignores the original cancellation subtotal while preserving genuine zero literal and signed-term evidence', () => {
        const original = {a: 2, b: 2, c: 4, input: {numerator: -3, denominator: 2}};
        expect(previousProfile('numeric-terms', original)).toBe(4);
        expect(inputsMeetNumericProfile('numeric-terms', original, 3)).toBe(true);
        expect(inputsMeetNumericProfile('numeric-terms', original, 4)).toBe(false);
        expect(inputsMeetNumericProfile('numeric-terms', {...original, input: {numerator: 3, denominator: 2}}, 3)).toBe(true);
        expect(inputsMeetNumericProfile('numeric-terms', {...original, input: {numerator: 0, denominator: 2}}, 2)).toBe(true);
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

    it('excludes generic polarity claims in every algebraic context, including the writer and quotient', () => {
        const quotient = [Area.AlgebraicExpression, Area.Division];
        expect(resolveNumericProfile([Scope.NumbersWithoutZero])).toBeUndefined();
        expect(resolveNumericProfile(quotient)).toBe(0);
        for (const context of [[Area.AlgebraicExpression, Area.Term],
            [Area.AlgebraicExpression, Scope.RationalNumbers], quotient,
            [Area.AlgebraicExpression, Area.NumericSubstitution],
            [Area.AlgebraicExpression, Area.AlgebraicModeling],
            [Area.AlgebraicExpression, Area.ArithmeticExpression, Area.Addition]]) {
            expect(resolveNumericProfile(context)).toBe(0);
            for (const claims of [[Scope.NumbersWithZero], [Scope.NumbersWithNegatives],
                [Scope.NumbersWithoutNegatives], [Scope.NumbersWithoutZero], ...numericProfileBundles]) {
                expect(resolveNumericProfile([...context, ...claims])).toBeUndefined();
            }
        }
        setSeed('pure-symbolic-quotient'); const state = getRandomState();
        expect(resolveNumericProfile(quotient)).toBe(0);
        expect(getRandomState()).toBe(state);
    });

    it('resolves purely and rejects a missing or incompatible mathematical profile', () => {
        setSeed('pure-algebra-profile'); const state = getRandomState();
        expect(resolveNumericProfile([Area.ArithmeticExpression, Area.Addition, ...numericProfileBundles[0]])).toBe(1);
        expect(getRandomState()).toBe(state);
        const generator = new AlgebraExpressionsGenerator();
        expect(() => generator.generate({relation: 'numeric-sum', power: 'none'})).toThrow(/numericProfile/);
        for (const relation of numericRelations.filter(relation => relation !== 'numeric-quotient')) {
            expect(() => generator.generate({relation, power: 'none', numericProfile: 4})).toThrow(/supported expression relation/);
        }
        expect(() => generator.generate({relation: 'numeric-quotient', power: 'none', numericProfile: 2})).toThrow();
        expect(() => generator.generate({relation: 'symbolic-sum', power: 'none', numericProfile: 1})).toThrow();
    });
});
