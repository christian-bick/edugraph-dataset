import { describe, expect, it } from 'vitest';
import DatasetPermutationBuilder, {
    defineImplementation,
    toImplementationTodos,
    toTargets
} from './dataset-permutation-builder.ts';

describe('DatasetPermutationBuilder target mapping', () => {
    it('maps active targets without implementation metadata', () => {
        const targets = toTargets('demo', new DatasetPermutationBuilder().addLabels(['A']));
        expect(targets).toHaveLength(1);
        expect(targets[0]).not.toHaveProperty('implementation');
    });

    it('maps implementation TODOs to a shared implementation definition', () => {
        const implementation = defineImplementation({
            id: 'number-line-extension',
            description: 'Extend number-line support.',
            generators: [{ module: 'arithmetic-ops-pairs', strategy: 'reuse' }],
            views: [{ module: 'operations-number-line', strategy: 'new' }]
        });
        const todos = toImplementationTodos(
            'demo',
            new DatasetPermutationBuilder().applyLabelVariants([['A'], ['B']]),
            implementation,
            'Needs an extended number-line renderer.'
        );
        expect(todos).toHaveLength(2);
        expect(todos.every(todo => todo.implementation === implementation)).toBe(true);
        expect(todos.every(todo => todo.explanation === 'Needs an extended number-line renderer.')).toBe(true);
    });

    it('normalizes implementation definitions and validates their modules', () => {
        expect(defineImplementation({
            id: ' package ',
            description: ' Package description. ',
            generators: [{ module: ' generator ', strategy: 'expand' }],
            views: [{ module: ' view ', strategy: 'reuse' }]
        })).toEqual({
            id: 'package',
            description: 'Package description.',
            generators: [{ module: 'generator', strategy: 'expand' }],
            views: [{ module: 'view', strategy: 'reuse' }]
        });

        expect(() => defineImplementation({
            id: 'package',
            description: 'Description.',
            generators: [],
            views: [{ module: 'view', strategy: 'reuse' }]
        })).toThrow(/at least one generator/);
        expect(() => defineImplementation({
            id: 'package',
            description: 'Description.',
            generators: [{ module: 'generator', strategy: 'reuse' }],
            views: [{ module: ' ', strategy: 'new' }]
        })).toThrow(/empty view module/);
    });
});
