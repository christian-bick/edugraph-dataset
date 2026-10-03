import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {NumericalExpressionNode} from '../../../types/problems.ts';
import {ArithmeticNumericalExpressionsGenerator} from './generator.ts';

const generator = new ArithmeticNumericalExpressionsGenerator();

function checkValues(node: NumericalExpressionNode): void {
    expect(Number.isSafeInteger(node.value)).toBe(true);
    expect(node.value).toBeGreaterThan(0);
    if (node.kind === 'number') return;
    if (node.kind === 'group') {
        checkValues(node.expression);
        expect(node.value).toBe(node.expression.value);
        return;
    }
    checkValues(node.left);
    checkValues(node.right);
    const expected = node.operation === 'addition' ? node.left.value + node.right.value
        : node.operation === 'subtraction' ? node.left.value - node.right.value
            : node.operation === 'multiplication' ? node.left.value * node.right.value
                : node.left.value / node.right.value;
    expect(node.value).toBe(expected);
}

describe('ArithmeticNumericalExpressionsGenerator', () => {
    it('rejects missing and unsupported configuration', () => {
        expect(() => generator.generate({})).toThrow();
        expect(generator.generate({structure: 'other'} as never)).toBeNull();
    });

    it('always makes grouping necessary and preserves an exact factor relationship', () => {
        const operations = new Set<string>();
        for (let seed = 1; seed <= 40; seed++) {
            setSeed(seed);
            const data = generator.generate({structure: 'grouped'})!.data;
            checkValues(data.expression);
            const root = data.expression;
            expect(root.kind).toBe('operation');
            if (root.kind !== 'operation') continue;
            expect(root.operation).toBe('multiplication');
            expect(root.left.kind).toBe('number');
            expect(root.right.kind).toBe('group');
            if (root.right.kind !== 'group') continue;
            const reference = data.multiplicativeComparison?.reference;
            expect(reference).toEqual(root.right.expression);
            expect(data.multiplicativeComparison?.factor).toBe(root.left.value);
            expect(root.value).toBe(root.left.value * root.right.expression.value);
            if (reference?.kind !== 'operation') continue;
            operations.add(reference.operation);
            const withoutGroup = reference.operation === 'addition'
                ? root.left.value * reference.left.value + reference.right.value
                : root.left.value * reference.left.value - reference.right.value;
            expect(root.value).not.toBe(withoutGroup);
        }
        expect(operations).toEqual(new Set(['addition', 'subtraction']));
    });

    it('always emits an exact ungrouped factor comparison without a group', () => {
        for (let seed = 1; seed <= 40; seed++) {
            setSeed(seed);
            const data = generator.generate({structure: 'ungrouped'})!.data;
            checkValues(data.expression);
            const root = data.expression;
            expect(root.kind).toBe('operation');
            if (root.kind !== 'operation') continue;
            expect(root.operation).toBe('multiplication');
            expect(root.left.kind).toBe('number');
            expect(root.right.kind).toBe('operation');
            expect(data.multiplicativeComparison).toEqual({
                reference: root.right,
                factor: root.left.value
            });
            expect(root.value).toBe(root.left.value * root.right.value);
            if (root.right.kind === 'operation') expect(root.right.operation).toBe('multiplication');
            expect(JSON.stringify(root)).not.toContain('"kind":"group"');
        }
    });

    it('replays the same expression for the same seed', () => {
        setSeed(82);
        const first = generator.generate({structure: 'grouped'})!.data;
        setSeed(82);
        expect(generator.generate({structure: 'grouped'})!.data).toEqual(first);
    });
});
