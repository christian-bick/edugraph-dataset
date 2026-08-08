import { describe, expect, it } from 'vitest';
import DatasetPermutationBuilder, { toImplementationTodos, toTargets } from './dataset-permutation-builder.ts';

describe('DatasetPermutationBuilder target mapping', () => {
    it('maps active targets without implementation metadata', () => {
        const targets = toTargets('demo', new DatasetPermutationBuilder().addLabels(['A']));
        expect(targets).toHaveLength(1);
        expect(targets[0]).not.toHaveProperty('group');
    });

    it('maps implementation TODOs with a stable group and explanation', () => {
        const todos = toImplementationTodos(
            'demo',
            new DatasetPermutationBuilder().applyLabelVariants([['A'], ['B']]),
            'number-line-extension',
            'Needs an extended number-line renderer.'
        );
        expect(todos).toHaveLength(2);
        expect(todos.every(todo => todo.group === 'number-line-extension')).toBe(true);
        expect(todos.every(todo => todo.explanation === 'Needs an extended number-line renderer.')).toBe(true);
    });

    it('rejects an empty implementation group', () => {
        expect(() => toImplementationTodos('demo', new DatasetPermutationBuilder(), '   ')).toThrow(/must not be empty/);
    });
});
