import {resolve} from 'node:path';
import {Ability, Area, ENTITY_RELATIONS, Scope} from 'edugraph-ts';
import type {DescriptorRelations} from 'edugraph-ts';
import {digestIdentity, radixSortUtf8} from './content-identity.ts';
import {resolveOntologyProvenance, type OntologyProvenance} from './coverage-identity.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from './model-catalog.ts';
import {loadTargets} from './spec-catalog.ts';

export const EXTERNAL_SEMANTICS_SCHEMA_VERSION = 1;

export type OntologyDimension = 'Area' | 'Scope' | 'Ability' | 'unknown';

export interface OntologySemanticEntity {
    dimension: OntologyDimension;
    identity_hash: string;
    definition_hash: string;
}

export interface OntologySemanticRelation {
    type: string;
    source: string;
    target: string;
    input_hash: string;
}

export interface OntologySemanticUsage {
    roots: string[];
    entities: string[];
    relations: string[];
    input_sha256: string;
}

export interface OntologySemanticSnapshot {
    schema_version: number;
    kind: 'ontology';
    complete: true;
    provenance: OntologyProvenance;
    entities: Record<string, OntologySemanticEntity>;
    relations: Record<string, OntologySemanticRelation>;
    usages: Record<string, OntologySemanticUsage>;
    semantic_sha256: string;
}

type JsonValue = null | boolean | number | string | JsonValue[] | {[key: string]: JsonValue};

function canonical(value: unknown): JsonValue {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
    if (Array.isArray(value)) return value.map(canonical);
    if (typeof value !== 'object') return String(value);
    const record = value as Record<string, unknown>;
    return Object.fromEntries(radixSortUtf8(Object.keys(record))
        .filter(key => record[key] !== undefined)
        .map(key => [key, canonical(record[key])]));
}

const snapshotHash = (value: unknown): string => digestIdentity(canonical(value));

function completedOntologySnapshot(
    provenance: OntologyProvenance,
    entities: Record<string, OntologySemanticEntity>,
    relations: Record<string, OntologySemanticRelation>,
    usages: Record<string, OntologySemanticUsage> = {}
): OntologySemanticSnapshot {
    const body = {
        schema_version: EXTERNAL_SEMANTICS_SCHEMA_VERSION,
        kind: 'ontology' as const,
        complete: true as const,
        provenance,
        entities,
        relations,
        usages
    };
    return {...body, semantic_sha256: snapshotHash(body)};
}

const dimensions = new Map<string, OntologyDimension>([
    ...Object.values(Area).map(value => [value, 'Area'] as const),
    ...Object.values(Scope).map(value => [value, 'Scope'] as const),
    ...Object.values(Ability).map(value => [value, 'Ability'] as const)
]);

function relationKey(type: string, source: string, target: string): string {
    return `${type}|${source}|${target}`;
}

export function buildOntologySemanticSnapshot(options: {
    entityRelations?: Readonly<Record<string, DescriptorRelations>>;
    provenance: OntologyProvenance;
}): OntologySemanticSnapshot {
    const source = options.entityRelations
        ?? ENTITY_RELATIONS as unknown as Readonly<Record<string, DescriptorRelations>>;
    const entities = new Map<string, OntologySemanticEntity>();
    const relations = new Map<string, OntologySemanticRelation>();
    for (const iri of radixSortUtf8(Object.keys(source))) {
        const record = source[iri] ?? {};
        const dimension = dimensions.get(iri) ?? 'unknown';
        entities.set(iri, {
            dimension,
            identity_hash: snapshotHash({iri, dimension}),
            definition_hash: snapshotHash({iri, definition: record.definition ?? ''})
        });
        for (const type of radixSortUtf8(Object.keys(record).filter(key => key !== 'definition'))) {
            const targets = record[type as keyof DescriptorRelations];
            if (!Array.isArray(targets)) continue;
            for (const target of radixSortUtf8([...new Set(targets as readonly string[])])) {
                const key = relationKey(type, iri, target);
                relations.set(key, {
                    type,
                    source: iri,
                    target,
                    input_hash: snapshotHash({type, source: iri, target})
                });
            }
        }
    }
    return completedOntologySnapshot(
        options.provenance,
        Object.fromEntries(radixSortUtf8([...entities.keys()]).map(id => [id, entities.get(id)!])),
        Object.fromEntries(radixSortUtf8([...relations.keys()]).map(id => [id, relations.get(id)!])),
        {}
    );
}

/** Adds a named project usage closure without changing the external entity/relation records. */
export function withOntologySemanticUsage(
    snapshot: OntologySemanticSnapshot,
    name: string,
    labels: readonly string[]
): OntologySemanticSnapshot {
    const roots = radixSortUtf8([...new Set(labels)]);
    const closure = new OntologySemanticIndex(snapshot).closure(roots);
    const usage: OntologySemanticUsage = {
        roots,
        entities: closure.entities,
        relations: closure.relations,
        input_sha256: snapshotHash({
            entities: closure.entities.map(iri => [iri, snapshot.entities[iri]?.identity_hash ?? null]),
            relations: closure.relations.map(id => [id, snapshot.relations[id]?.input_hash ?? null])
        })
    };
    const usages = {
        ...snapshot.usages,
        [name]: usage
    };
    return completedOntologySnapshot(snapshot.provenance, snapshot.entities, snapshot.relations,
        Object.fromEntries(radixSortUtf8(Object.keys(usages)).map(id => [id, usages[id]])));
}

/**
 * Resolves the semantic closure used by one authored spec directly from the
 * exact installed ontology. The persisted dependency graph, not a second
 * checked-in snapshot, retains the prior records needed for delta comparison.
 */
export async function resolveOntologySemanticUsage(
    projectRoot: string,
    specName: string
): Promise<{snapshot: OntologySemanticSnapshot; usage: OntologySemanticUsage}> {
    const [generators, views, targets] = await Promise.all([
        loadGeneratorModelCatalog(resolve(projectRoot, 'src', 'generators')),
        loadViewModelCatalog(resolve(projectRoot, 'src', 'visuals', 'views')),
        loadTargets(specName, resolve(projectRoot, 'src', 'spec'))
    ]);
    const labels = [
        ...generators.flatMap(generator => generator.labels),
        ...views.flatMap(view => [
            ...view.supportedLabels,
            ...(view.requiredLabels ?? []),
            ...(view.rejectedLabels ?? [])
        ]),
        ...targets.flatMap(target => target.labels)
    ];
    const snapshot = withOntologySemanticUsage(
        buildOntologySemanticSnapshot({provenance: resolveOntologyProvenance(projectRoot)}),
        specName,
        labels
    );
    return {snapshot, usage: snapshot.usages[specName]};
}

export interface OntologyUsageClosure {
    entities: string[];
    relations: string[];
    work: {entities_visited: number; relations_visited: number};
}

/** Indexes ontology relations once and resolves exact transitive semantic usage in linear closure work. */
export class OntologySemanticIndex {
    private readonly outgoing = new Map<string, OntologySemanticRelation[]>();

    constructor(readonly snapshot: OntologySemanticSnapshot) {
        for (const relation of Object.values(snapshot.relations)) {
            const group = this.outgoing.get(relation.source);
            if (group) group.push(relation);
            else this.outgoing.set(relation.source, [relation]);
        }
    }

    closure(labels: readonly string[], relationTypes: readonly string[] = ['partOf']): OntologyUsageClosure {
        const accepted = new Set(relationTypes);
        const entities = new Set<string>();
        const relations = new Set<string>();
        const queue = [...labels];
        let cursor = 0;
        let relationVisits = 0;
        while (cursor < queue.length) {
            const iri = queue[cursor++];
            if (entities.has(iri)) continue;
            entities.add(iri);
            for (const relation of this.outgoing.get(iri) ?? []) {
                relationVisits++;
                if (!accepted.has(relation.type)) continue;
                relations.add(relationKey(relation.type, relation.source, relation.target));
                if (!entities.has(relation.target)) queue.push(relation.target);
            }
        }
        return {
            entities: radixSortUtf8([...entities]),
            relations: radixSortUtf8([...relations]),
            work: {entities_visited: entities.size, relations_visited: relationVisits}
        };
    }
}
