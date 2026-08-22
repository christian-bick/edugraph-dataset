import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Ability, Area, ENTITY_RELATIONS, Scope} from 'edugraph-ts';
import type {DescriptorRelations} from 'edugraph-ts';
import {digestIdentity, radixSortUtf8} from './content-identity.ts';
import type {OntologyProvenance} from './coverage-identity.ts';
import type {StandardsProvenance} from './standards-source.ts';
import type {StandardNode} from '../standards-explorer/types.ts';

export const EXTERNAL_SEMANTICS_SCHEMA_VERSION = 1;
export const STANDARDS_SEMANTICS_PATH = ['config', 'external-semantics', 'ccss.json'] as const;
export const ONTOLOGY_SEMANTICS_PATH = ['config', 'external-semantics', 'ontology.json'] as const;

export type OntologyDimension = 'Area' | 'Scope' | 'Ability' | 'unknown';

export interface StandardsSemanticRecord {
    kind: 'standard' | 'domain-group';
    input_hash: string;
}

export interface StandardsSemanticSnapshot {
    schema_version: number;
    kind: 'standards';
    complete: true;
    provenance: StandardsProvenance;
    records: Record<string, StandardsSemanticRecord>;
    semantic_sha256: string;
}

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

export interface SemanticChanges {
    added: string[];
    changed: string[];
    removed: string[];
}

export interface StandardsSemanticDelta {
    kind: 'standards';
    from: string | null;
    to: string;
    records: SemanticChanges;
    work: {previous_records: number; current_records: number; records_compared: number};
}

export interface OntologySemanticDelta {
    kind: 'ontology';
    from: string | null;
    to: string;
    entities: SemanticChanges;
    relations: SemanticChanges;
    usages: SemanticChanges;
    work: {
        previous_entities: number;
        current_entities: number;
        previous_relations: number;
        current_relations: number;
        previous_usages: number;
        current_usages: number;
        records_compared: number;
    };
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

function completedStandardsSnapshot(
    provenance: StandardsProvenance,
    records: Record<string, StandardsSemanticRecord>
): StandardsSemanticSnapshot {
    const body = {
        schema_version: EXTERNAL_SEMANTICS_SCHEMA_VERSION,
        kind: 'standards' as const,
        complete: true as const,
        provenance,
        records
    };
    return {...body, semantic_sha256: snapshotHash(body)};
}

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

export function buildStandardsSemanticSnapshot(options: {
    standards: readonly StandardNode[];
    domainGroups: Readonly<Record<string, unknown>>;
    provenance: StandardsProvenance;
}): StandardsSemanticSnapshot {
    const records = new Map<string, StandardsSemanticRecord>();
    for (const standard of options.standards) {
        const id = `standard:${standard.id}`;
        if (records.has(id)) throw new Error(`Duplicate external standard id: ${standard.id}.`);
        records.set(id, {kind: 'standard', input_hash: snapshotHash(standard)});
    }
    for (const name of Object.keys(options.domainGroups)) {
        const id = `domain-group:${name}`;
        records.set(id, {
            kind: 'domain-group',
            input_hash: snapshotHash(options.domainGroups[name])
        });
    }
    return completedStandardsSnapshot(
        options.provenance,
        Object.fromEntries(radixSortUtf8([...records.keys()]).map(id => [id, records.get(id)!]))
    );
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

function changes<T>(
    previous: Readonly<Record<string, T>>,
    current: Readonly<Record<string, T>>,
    identity: (record: T) => string
): SemanticChanges & {compared: number} {
    const added: string[] = [];
    const changed: string[] = [];
    const removed: string[] = [];
    let compared = 0;
    for (const id of Object.keys(current)) {
        compared++;
        const old = previous[id];
        if (!old) added.push(id);
        else if (identity(old) !== identity(current[id])) changed.push(id);
    }
    for (const id of Object.keys(previous)) {
        compared++;
        if (!current[id]) removed.push(id);
    }
    return {
        added: radixSortUtf8(added),
        changed: radixSortUtf8(changed),
        removed: radixSortUtf8(removed),
        compared
    };
}

export function diffStandardsSemantics(
    previous: StandardsSemanticSnapshot | null,
    current: StandardsSemanticSnapshot
): StandardsSemanticDelta {
    const delta = changes(previous?.records ?? {}, current.records, record => record.input_hash);
    return {
        kind: 'standards',
        from: previous?.provenance.revision ?? null,
        to: current.provenance.revision,
        records: {added: delta.added, changed: delta.changed, removed: delta.removed},
        work: {
            previous_records: Object.keys(previous?.records ?? {}).length,
            current_records: Object.keys(current.records).length,
            records_compared: delta.compared
        }
    };
}

export function diffOntologySemantics(
    previous: OntologySemanticSnapshot | null,
    current: OntologySemanticSnapshot
): OntologySemanticDelta {
    const entityDelta = changes(previous?.entities ?? {}, current.entities, record =>
        `${record.identity_hash}:${record.definition_hash}`);
    const relationDelta = changes(previous?.relations ?? {}, current.relations, record => record.input_hash);
    const usageDelta = changes(previous?.usages ?? {}, current.usages, record => record.input_sha256);
    return {
        kind: 'ontology',
        from: previous?.provenance.version ?? null,
        to: current.provenance.version,
        entities: {
            added: entityDelta.added,
            changed: entityDelta.changed,
            removed: entityDelta.removed
        },
        relations: {
            added: relationDelta.added,
            changed: relationDelta.changed,
            removed: relationDelta.removed
        },
        usages: {
            added: usageDelta.added,
            changed: usageDelta.changed,
            removed: usageDelta.removed
        },
        work: {
            previous_entities: Object.keys(previous?.entities ?? {}).length,
            current_entities: Object.keys(current.entities).length,
            previous_relations: Object.keys(previous?.relations ?? {}).length,
            current_relations: Object.keys(current.relations).length,
            previous_usages: Object.keys(previous?.usages ?? {}).length,
            current_usages: Object.keys(current.usages).length,
            records_compared: entityDelta.compared + relationDelta.compared + usageDelta.compared
        }
    };
}

function assertSnapshotHash(snapshot: StandardsSemanticSnapshot | OntologySemanticSnapshot): void {
    const {semantic_sha256: recorded, ...body} = snapshot;
    const expected = snapshotHash(body);
    if (recorded !== expected) {
        throw new Error(`${snapshot.kind} semantic snapshot failed integrity verification.`);
    }
}

export function readStandardsSemanticSnapshot(projectRoot: string): StandardsSemanticSnapshot | null {
    const path = resolve(projectRoot, ...STANDARDS_SEMANTICS_PATH);
    if (!existsSync(path)) return null;
    const snapshot = JSON.parse(readFileSync(path, 'utf-8')) as StandardsSemanticSnapshot;
    if (snapshot.schema_version !== EXTERNAL_SEMANTICS_SCHEMA_VERSION
        || snapshot.kind !== 'standards'
        || snapshot.complete !== true) {
        throw new Error(`Unsupported or incomplete standards semantic snapshot at ${path}.`);
    }
    assertSnapshotHash(snapshot);
    return snapshot;
}

export function readOntologySemanticSnapshot(projectRoot: string): OntologySemanticSnapshot | null {
    const path = resolve(projectRoot, ...ONTOLOGY_SEMANTICS_PATH);
    if (!existsSync(path)) return null;
    const snapshot = JSON.parse(readFileSync(path, 'utf-8')) as OntologySemanticSnapshot;
    if (snapshot.schema_version !== EXTERNAL_SEMANTICS_SCHEMA_VERSION
        || snapshot.kind !== 'ontology'
        || snapshot.complete !== true) {
        throw new Error(`Unsupported or incomplete ontology semantic snapshot at ${path}.`);
    }
    assertSnapshotHash(snapshot);
    return snapshot;
}

export function ontologySemanticUsageHash(projectRoot: string, name: string): string {
    const snapshot = readOntologySemanticSnapshot(projectRoot);
    const usage = snapshot?.usages?.[name];
    if (!usage) {
        throw new Error(
            `Ontology semantic usage "${name}" is unavailable. Run update:ontology-source --apply explicitly.`
        );
    }
    return usage.input_sha256;
}

export function standardsSemanticProvenanceMatches(
    snapshot: StandardsSemanticSnapshot,
    provenance: StandardsProvenance
): boolean {
    return snapshotHash(snapshot.provenance) === snapshotHash(provenance);
}

export function ontologySemanticProvenanceMatches(
    snapshot: OntologySemanticSnapshot,
    provenance: OntologyProvenance
): boolean {
    return snapshotHash(snapshot.provenance) === snapshotHash(provenance);
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

interface StandardIdIndexNode {
    children: Map<string, StandardIdIndexNode>;
    standardId?: string;
}

/** Resolves authored target prefixes to the exact pinned standard record without rescanning IDs. */
export class StandardsSemanticIndex {
    private readonly root: StandardIdIndexNode = {children: new Map()};

    constructor(readonly snapshot: StandardsSemanticSnapshot) {
        for (const recordId of Object.keys(snapshot.records)) {
            if (!recordId.startsWith('standard:')) continue;
            const standardId = recordId.slice('standard:'.length);
            let node = this.root;
            for (const character of standardId) {
                let child = node.children.get(character);
                if (!child) {
                    child = {children: new Map()};
                    node.children.set(character, child);
                }
                node = child;
            }
            node.standardId = standardId;
        }
    }

    standardForTarget(targetId: string): string | null {
        let node = this.root;
        let matched: string | null = null;
        for (let index = 0; index < targetId.length; index++) {
            const child = node.children.get(targetId[index]);
            if (!child) break;
            node = child;
            if (node.standardId && (index === targetId.length - 1 || targetId[index + 1] === '-')) {
                matched = node.standardId;
            }
        }
        return matched;
    }
}
