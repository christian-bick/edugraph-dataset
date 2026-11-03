import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import type {NumericalExpressionNode} from '../../../types/problems.ts';
import {numericalExpressionProfiles} from '../numerical-expression-domain.ts';
import {ArithmeticNumericalExpressionCalculationsGenerator} from './generator.ts';

const generator = new ArithmeticNumericalExpressionCalculationsGenerator();
function values(node: NumericalExpressionNode): number[] {
    expect(Number.isSafeInteger(node.value)).toBe(true);
    expect(node.value).toBeGreaterThan(0);
    if (node.kind === 'number') return [node.value];
    if (node.kind === 'group') {
        expect(node.value).toBe(node.expression.value);
        return values(node.expression);
    }
    const expected = node.operation === 'addition' ? node.left.value + node.right.value
        : node.operation === 'subtraction' ? node.left.value - node.right.value : node.left.value * node.right.value;
    expect(node.value).toBe(expected);
    return [...values(node.left), ...values(node.right), node.value];
}

describe('ArithmeticNumericalExpressionCalculationsGenerator', () => {
    it('rejects missing or malformed configuration and returns null for an empty calculation cell', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({profile: {structure: 'other'}} as never)).toThrow();
        expect(generator.generate({profile: {structure: 'grouped', range: createCanonicalNumericRange(5)}})).toBeNull();
    });

    it('retains grouped and ungrouped exact calculations with tight bounds on every required value', () => {
        for (const {profile} of numericalExpressionProfiles('calculation')) for (let seed = 0; seed < 12; seed++) {
            setSeed(seed);
            const data = generator.generate({profile})!.data;
            expect(hasCanonicalRangeWitness(values(data.expression), profile.range)).toBe(true);
            const root = data.expression;
            if (root.kind !== 'operation' || root.left.kind !== 'number') throw new Error('Expected a canonical product.');
            const reference = root.right.kind === 'group' ? root.right.expression : root.right;
            expect(data.multiplicativeComparison).toEqual({factor: root.left.value, reference});
            expect(root.right.kind === 'group').toBe(profile.structure === 'grouped');
            expect(root.value).toBe(root.left.value * reference.value);
        }
    });

    it('replays exact mathematics and random continuation for every profile', () => {
        for (const {profile} of numericalExpressionProfiles('calculation')) {
            setSeed(82);
            const first = {stub: generator.generate({profile}), state: getRandomState()};
            setSeed(82);
            expect({stub: generator.generate({profile}), state: getRandomState()}).toEqual(first);
        }
    });
});
