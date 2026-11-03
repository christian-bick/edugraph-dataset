import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import type {NumericalExpressionStructureNode} from '../../../types/problems.ts';
import {numericalExpressionProfiles} from '../numerical-expression-domain.ts';
import {ArithmeticNumericalExpressionsGenerator} from './generator.ts';

const generator = new ArithmeticNumericalExpressionsGenerator();
function literals(node: NumericalExpressionStructureNode): number[] {
    if (node.kind === 'number') return [node.value];
    expect('value' in node).toBe(false);
    return node.kind === 'group' ? literals(node.expression) : [...literals(node.left), ...literals(node.right)];
}

describe('ArithmeticNumericalExpressionsGenerator', () => {
    it('rejects missing or malformed profiles and returns null for a valid empty mathematical cell', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({profile: {structure: 'other'}} as never)).toThrow();
        expect(generator.generate({profile: {structure: 'grouped', range: createCanonicalNumericRange(5)}})).toBeNull();
    });

    it('generates only literal-bound syntax with the supplied grouping and exact structural factor relation', () => {
        for (const {profile} of numericalExpressionProfiles('structure')) for (let seed = 0; seed < 12; seed++) {
            setSeed(seed);
            const data = generator.generate({profile})!.data;
            expect(hasCanonicalRangeWitness(literals(data.expression), profile.range)).toBe(true);
            const root = data.expression;
            if (root.kind !== 'operation' || root.left.kind !== 'number') throw new Error('Expected a canonical factor product.');
            expect(root.operation).toBe('multiplication');
            const reference = root.right.kind === 'group' ? root.right.expression : root.right;
            expect(data.multiplicativeComparison).toEqual({factor: root.left.value, reference});
            expect(root.right.kind === 'group').toBe(profile.structure === 'grouped');
        }
    });

    it('replays syntax and the exact random continuation for each resolved profile', () => {
        for (const {profile} of numericalExpressionProfiles('structure')) {
            setSeed(82);
            const first = {stub: generator.generate({profile}), state: getRandomState()};
            setSeed(82);
            expect({stub: generator.generate({profile}), state: getRandomState()}).toEqual(first);
        }
    });
});
