import {existsSync, lstatSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {
    type BeyondScopeEntry,
    type CompetencyTarget,
    type Implementation,
    type ImplementationTodo,
    type OntologyPackage,
    type OntologyTodo,
    type TargetEquivalence
} from '../types/ml-engine.ts';
import {defineImplementationPackage} from './dataset-permutation-builder.ts';
import {defineOntologyPackage, toOntologyTodo} from './ontology-todo.ts';
import {radixSortUtf8} from './content-identity.ts';

const PROJECT_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const MODULE_META_PREFIX = '_';
const MODULE_META_FILE = '_module.ts';
const DEFAULT_UNION_ORDER = 100;
const defaultSpecRoot = () => resolve(PROJECT_ROOT, 'src', 'spec');

function resolveSpecFiles(specName: string, specRoot: string): string[] {
    const specPath = resolve(specRoot, specName);
    const specDir = existsSync(specPath) && lstatSync(specPath).isDirectory() ? specPath : null;
    const specFile = !specDir && existsSync(`${specPath}.ts`) ? `${specPath}.ts` : null;
    if (!specDir && !specFile) throw new Error(`Spec module not found at: ${specPath}`);
    return specDir
        ? radixSortUtf8(readdirSync(specDir)
            .filter(file => file.endsWith('.ts') && !file.startsWith(MODULE_META_PREFIX)))
            .map(file => resolve(specDir, file))
        : [specFile!];
}
export interface SpecModuleMetadata {
    isolated: boolean;
    unionOrder: number;
}

export async function loadSpecMetadata(
    specName: string,
    specRoot: string = defaultSpecRoot()
): Promise<SpecModuleMetadata> {
    const metaPath = resolve(specRoot, specName, MODULE_META_FILE);
    if (!existsSync(metaPath)) return {isolated: false, unionOrder: DEFAULT_UNION_ORDER};
    const module = await import(pathToFileURL(metaPath).href);
    const unionOrder = module.unionOrder ?? DEFAULT_UNION_ORDER;
    if (!Number.isSafeInteger(unionOrder) || unionOrder < 0) {
        throw new Error(`Spec unionOrder must be a non-negative safe integer: ${metaPath}.`);
    }
    return {isolated: module.isolated === true, unionOrder};
}

export function listSpecModules(specRoot: string = defaultSpecRoot()): string[] {
    if (!existsSync(specRoot)) return [];
    return radixSortUtf8(readdirSync(specRoot)
        .filter(entry => {
            const entryPath = resolve(specRoot, entry);
            return lstatSync(entryPath).isDirectory() || entry.endsWith('.ts');
        })
        .map(entry => entry.replace(/\.ts$/, '')));
}

export async function listUnionSpecs(specRoot: string = defaultSpecRoot()): Promise<string[]> {
    const entries: {specName: string; unionOrder: number}[] = [];
    for (const specName of listSpecModules(specRoot)) {
        const {isolated, unionOrder} = await loadSpecMetadata(specName, specRoot);
        if (!isolated) entries.push({specName, unionOrder});
    }
    const byOrder = new Map<number, string[]>();
    for (const entry of entries) {
        const names = byOrder.get(entry.unionOrder);
        if (names) names.push(entry.specName);
        else byOrder.set(entry.unionOrder, [entry.specName]);
    }
    const orderByKey = new Map([...byOrder.keys()]
        .map(order => [order.toString().padStart(16, '0'), order]));
    return radixSortUtf8([...orderByKey.keys()]).flatMap(key =>
        radixSortUtf8(byOrder.get(orderByKey.get(key)!) ?? []));
}

export async function loadTargets(
    specName: string,
    specRoot: string = defaultSpecRoot()
): Promise<CompetencyTarget[]> {
    const targets: CompetencyTarget[] = [];
    for (const filePath of resolveSpecFiles(specName, specRoot)) {
        const module = await import(pathToFileURL(filePath).href);
        if (!Array.isArray(module.spec)) {
            throw new Error(`Spec file "${filePath}" does not export a "spec" array of CompetencyTarget.`);
        }
        targets.push(...module.spec as CompetencyTarget[]);
    }
    return targets;
}

export interface SpecTodos {
    implementationTodos: ImplementationTodo[];
    ontologyTodos: OntologyTodo[];
    beyondScope: BeyondScopeEntry[];
}

export async function loadSpecTodos(
    specName: string,
    specRoot: string = defaultSpecRoot()
): Promise<SpecTodos> {
    const implementationTodos: ImplementationTodo[] = [];
    const ontologyTodos: OntologyTodo[] = [];
    const beyondScope: BeyondScopeEntry[] = [];
    const normalizedImplementations = new WeakMap<object, Implementation>();
    const normalizedOntologies = new WeakMap<object, OntologyPackage>();
    const ontologiesById = new Map<string, OntologyPackage>();
    for (const filePath of resolveSpecFiles(specName, specRoot)) {
        const module = await import(pathToFileURL(filePath).href);
        if (Array.isArray(module.implementationTodos)) {
            for (const todo of module.implementationTodos as ImplementationTodo[]) {
                if (!todo.implementation || typeof todo.implementation !== 'object') {
                    throw new Error(
                        `Implementation TODO "${todo.id ?? 'unknown'}" in "${filePath}" must reference an implementation definition.`
                    );
                }
                let implementation = normalizedImplementations.get(todo.implementation);
                if (!implementation) {
                    try {
                        implementation = defineImplementationPackage(todo.implementation);
                    } catch (error) {
                        throw new Error(
                            `Invalid implementation definition for TODO "${todo.id ?? 'unknown'}" in "${filePath}": `
                            + `${error instanceof Error ? error.message : String(error)}`
                        );
                    }
                    normalizedImplementations.set(todo.implementation, implementation);
                }
                implementationTodos.push({...todo, implementation});
            }
        }
        if (Array.isArray(module.ontologyTodos)) {
            for (const todo of module.ontologyTodos as OntologyTodo[]) {
                if (!todo.ontology || typeof todo.ontology !== 'object') {
                    throw new Error(
                        `Ontology TODO "${todo.standardId ?? 'unknown'}" in "${filePath}" must reference an ontology package.`
                    );
                }
                let ontology = normalizedOntologies.get(todo.ontology);
                if (!ontology) {
                    try {
                        ontology = defineOntologyPackage(todo.ontology);
                    } catch (error) {
                        throw new Error(
                            `Invalid ontology package for TODO "${todo.standardId ?? 'unknown'}" in "${filePath}": `
                            + `${error instanceof Error ? error.message : String(error)}`
                        );
                    }
                    normalizedOntologies.set(todo.ontology, ontology);
                }
                const existing = ontologiesById.get(ontology.id);
                if (existing && JSON.stringify(existing) !== JSON.stringify(ontology)) {
                    throw new Error(`Ontology package id "${ontology.id}" has conflicting definitions.`);
                }
                const canonicalOntology = existing ?? ontology;
                ontologiesById.set(canonicalOntology.id, canonicalOntology);
                try {
                    ontologyTodos.push(toOntologyTodo(
                        todo.standardId,
                        todo.title,
                        canonicalOntology,
                        todo.description
                    ));
                } catch (error) {
                    throw new Error(
                        `Invalid ontology TODO "${todo.standardId ?? 'unknown'}" in "${filePath}": `
                        + `${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }
        }
        if (Array.isArray(module.beyondScope)) {
            beyondScope.push(...module.beyondScope as BeyondScopeEntry[]);
        }
    }
    return {implementationTodos, ontologyTodos, beyondScope};
}

export async function loadSpecEquivalences(
    specName: string,
    specRoot: string = defaultSpecRoot()
): Promise<TargetEquivalence[]> {
    const equivalences: TargetEquivalence[] = [];
    for (const filePath of resolveSpecFiles(specName, specRoot)) {
        const module = await import(pathToFileURL(filePath).href);
        if (Array.isArray(module.equivalentTargets)) {
            equivalences.push(...module.equivalentTargets as TargetEquivalence[]);
        }
    }
    return equivalences;
}
