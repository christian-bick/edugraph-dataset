import { describe, expect, it } from 'vitest';
import { Area, Scope } from 'edugraph-ts/generated';
import DatasetPermutationBuilder, {
    defineImplementationPackage,
    toImplementationTodos,
    toTargets
} from './dataset-permutation-builder.ts';

describe('DatasetPermutationBuilder target mapping', () => {
    it('makes reviewed ranges equivalent to explicit variants before content-derived IDs', () => {
        const expanded = new DatasetPermutationBuilder()
            .addLabels([Scope.NumbersSmaller20, Scope.NumbersWithoutZero])
            .applyLabelVariants([[Area.Addition], [Area.Subtraction]])
            .applyUpperRangeVariants({ through: 20 });
        const explicit = new DatasetPermutationBuilder()
            .addLabels([Scope.NumbersWithoutZero])
            .applyLabelVariants([[Area.Addition], [Area.Subtraction]])
            .applyLabelVariants([[Scope.NumbersSmaller5], [Scope.NumbersSmaller10], [Scope.NumbersSmaller20]]);
        expect(toTargets('reviewed', expanded, 'Source competency.'))
            .toEqual(toTargets('reviewed', explicit, 'Source competency.'));
    });

    it('retains existing IDs and orthogonal permutations while adding reviewed ranges', () => {
        const builder = () => new DatasetPermutationBuilder().addLabels([Area.Addition, Scope.NumbersSmaller20])
            .applyLabelVariants([[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]);
        const existing = toTargets('same-prefix', builder());
        const expanded = toTargets('same-prefix', builder().applyUpperRangeVariants({ bands: [20, 5, 10, 5] }));
        expect(expanded).toHaveLength(6);
        for (const target of existing) {
            const retained = expanded.find(candidate => candidate.id === target.id);
            expect(new Set(retained?.labels)).toEqual(new Set(target.labels));
        }
        expect(new Set(expanded.map(target => target.id)).size).toBe(6);
        expect(builder().build()).toHaveLength(2);
    });

    it('leaves the builder unchanged when reviewed bounds are invalid', () => {
        const builder = new DatasetPermutationBuilder().addLabels([Area.Addition, Scope.NumbersSmaller10]);
        const before = structuredClone(builder.build());
        expect(() => builder.applyUpperRangeVariants({ through: 20 })).toThrow(/widen/);
        expect(builder.build()).toEqual(before);
    });

    it('maps active targets without implementation metadata', () => {
        const targets = toTargets('demo', new DatasetPermutationBuilder().addLabels(['A']));
        expect(targets).toHaveLength(1);
        expect(targets[0]).not.toHaveProperty('implementation');
    });

    it('maps implementation TODOs to a shared implementation definition', () => {
        const implementation = defineImplementationPackage({
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
        expect(defineImplementationPackage({
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

        expect(() => defineImplementationPackage({
            id: 'package',
            description: 'Description.',
            generators: [],
            views: [{ module: 'view', strategy: 'reuse' }]
        })).toThrow(/at least one generator/);
        expect(() => defineImplementationPackage({
            id: 'package',
            description: 'Description.',
            generators: [{ module: 'generator', strategy: 'reuse' }],
            views: [{ module: ' ', strategy: 'new' }]
        })).toThrow(/empty view module/);
    });
});
