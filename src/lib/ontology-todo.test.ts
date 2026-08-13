import { describe, expect, it } from 'vitest';
import { defineOntologyPackage, groupOntologyTodos, toOntologyTodo } from './ontology-todo.ts';

describe('ontology TODO packages', () => {
    it('normalizes a shared package and creates leaf-indexed references', () => {
        const ontology = defineOntologyPackage({
            id: ' area-units ',
            description: ' Add area unit concepts. ',
            changes: [
                { dimension: 'Area', entities: [' UnitIteration '] },
                { dimension: 'Scope', entities: ['AreaMeasurement', 'UnitSquares'] }
            ]
        });

        expect(ontology).toEqual({
            id: 'area-units',
            description: 'Add area unit concepts.',
            changes: [
                { dimension: 'Area', entities: ['UnitIteration'] },
                { dimension: 'Scope', entities: ['AreaMeasurement', 'UnitSquares'] }
            ]
        });
        expect(toOntologyTodo(' 3.MD.C.5a ', ' Unit square ', ontology, ' Explain the unit. ')).toEqual({
            standardId: '3.MD.C.5a',
            title: 'Unit square',
            description: 'Explain the unit.',
            ontology
        });
    });

    it.each([
        [{ id: '', description: 'x', changes: [{ dimension: 'Area', entities: ['X'] }] }, /id must not be empty/],
        [{ id: 'x', description: '', changes: [{ dimension: 'Area', entities: ['X'] }] }, /description must not be empty/],
        [{ id: 'x', description: 'x', changes: [] }, /at least one change/],
        [{ id: 'x', description: 'x', changes: [{ dimension: 'Area', entities: [] }] }, /at least one Area entity/],
        [{ id: 'x', description: 'x', changes: [{ dimension: 'Area', entities: ['X', 'X'] }] }, /duplicate Area entity/],
        [{ id: 'x', description: 'x', changes: [
            { dimension: 'Scope', entities: ['X'] },
            { dimension: 'Scope', entities: ['Y'] }
        ] }, /one change per dimension/],
        [{ id: 'x', description: 'x', changes: [{ dimension: 'Topic', entities: ['X'] }] }, /invalid dimension/]
    ])('rejects invalid package %#', (value, message) => {
        expect(() => defineOntologyPackage(value as never)).toThrow(message as RegExp);
    });

    it.each([
        ['', 'title', 'description', /standardId must not be empty/],
        ['X', '', 'description', /title must not be empty/],
        ['X', 'title', '', /description must not be empty/]
    ])('rejects invalid leaf references %#', (standardId, title, description, message) => {
        const ontology = defineOntologyPackage({
            id: 'package',
            description: 'Description',
            changes: [{ dimension: 'Ability', entities: ['Interpretation'] }]
        });
        expect(() => toOntologyTodo(standardId, title, ontology, description)).toThrow(message);
    });

    it('groups leaf references by authored package identity', () => {
        const first = defineOntologyPackage({
            id: 'shared',
            description: 'Shared change',
            changes: [{ dimension: 'Area', entities: ['A'] }]
        });
        const second = defineOntologyPackage({
            id: 'separate',
            description: 'Separate change',
            changes: [{ dimension: 'Scope', entities: ['B'] }]
        });
        const todos = [
            toOntologyTodo('X.1', 'First', first, 'First leaf'),
            toOntologyTodo('Y.1', 'Second', second, 'Second leaf'),
            toOntologyTodo('X.2', 'Third', first, 'Third leaf')
        ];

        expect(groupOntologyTodos(todos)).toEqual([
            { ontology: first, todos: [todos[0], todos[2]] },
            { ontology: second, todos: [todos[1]] }
        ]);
    });
});
