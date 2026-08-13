import {
    OntologyChange,
    OntologyDimension,
    OntologyPackage,
    OntologyTodo
} from '../types/ml-engine.ts';

const ONTOLOGY_DIMENSIONS = new Set<OntologyDimension>(['Area', 'Scope', 'Ability']);

const requireText = (value: string, field: string): string => {
    const normalized = value.trim();
    if (normalized === '') throw new Error(`${field} must not be empty.`);
    return normalized;
};

const normalizeChange = (packageId: string, change: OntologyChange): OntologyChange => {
    if (!ONTOLOGY_DIMENSIONS.has(change.dimension)) {
        throw new Error(`Ontology package "${packageId}" has invalid dimension "${change.dimension}".`);
    }
    if (!Array.isArray(change.entities) || change.entities.length === 0) {
        throw new Error(`Ontology package "${packageId}" must declare at least one ${change.dimension} entity.`);
    }

    const entities = change.entities.map(entity =>
        requireText(entity, `Ontology package "${packageId}" ${change.dimension} entity`));
    if (new Set(entities).size !== entities.length) {
        throw new Error(`Ontology package "${packageId}" declares a duplicate ${change.dimension} entity.`);
    }
    return { dimension: change.dimension, entities };
};

/** Defines one reviewed ontology package independently of its leaf references. */
export function defineOntologyPackage(ontology: OntologyPackage): OntologyPackage {
    const id = requireText(ontology.id, 'Ontology package id');
    const description = requireText(ontology.description, `Ontology package "${id}" description`);
    if (!Array.isArray(ontology.changes) || ontology.changes.length === 0) {
        throw new Error(`Ontology package "${id}" must declare at least one change.`);
    }

    const changes = ontology.changes.map(change => normalizeChange(id, change));
    const dimensions = changes.map(change => change.dimension);
    if (new Set(dimensions).size !== dimensions.length) {
        throw new Error(`Ontology package "${id}" must consolidate entities into one change per dimension.`);
    }
    return { id, description, changes };
}

/** Creates one leaf-indexed ontology TODO that references a shared ontology package. */
export function toOntologyTodo(
    standardId: string,
    title: string,
    ontology: OntologyPackage,
    description: string
): OntologyTodo {
    return {
        standardId: requireText(standardId, 'Ontology TODO standardId'),
        title: requireText(title, 'Ontology TODO title'),
        description: requireText(description, 'Ontology TODO description'),
        ontology
    };
}

export interface OntologyTodoGroup {
    ontology: OntologyPackage;
    todos: OntologyTodo[];
}

/** Groups leaf references by their authored package id in first-seen order. */
export function groupOntologyTodos(todos: readonly OntologyTodo[]): OntologyTodoGroup[] {
    const groups = new Map<string, OntologyTodoGroup>();
    for (const todo of todos) {
        if (!groups.has(todo.ontology.id)) {
            groups.set(todo.ontology.id, { ontology: todo.ontology, todos: [] });
        }
        groups.get(todo.ontology.id)!.todos.push(todo);
    }
    return [...groups.values()];
}
