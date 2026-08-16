/**
 * Union dataset merge logic.
 *
 * Each education standard generates into its own dataset folder; the union is
 * built by merging them in precedence order. Standards overlap heavily by
 * design, so the merge deduplicates content across them: the first standard to
 * contribute a given exercise keeps it, and later standards add only their
 * delta.
 *
 * Dedup extends the generation-time rule (`generateModuleSamples`) across
 * standards: by content fingerprint per (split, view), with the validation
 * split additionally rejecting content already present in train. Generation
 * scopes the same rule per module, since a view has only one generator; the
 * merge spans whole standards and so scopes per (split, view).
 */

export interface TargetAssociation {
    spec: string;
    target_id: string;
}

export interface MetadataRow {
    file_name: string;
    sample_key: string;
    spec: string;
    target_id: string;
    generator: string;
    view: string;
    mode: string;
    instance: number;
    content_fingerprint: string;
    /** Additional target permutations represented by the same physical sample. */
    target_associations?: TargetAssociation[];
    /** Shortened ontology labels, as written by the pipeline. */
    tags?: string[];
    [key: string]: unknown;
}

const associationKey = ({spec, target_id}: TargetAssociation): string => `${spec}\0${target_id}`;

/** Returns the primary target and every deduplicated target associated with a physical row. */
export function rowTargetAssociations(row: MetadataRow): TargetAssociation[] {
    const associations = new Map<string, TargetAssociation>();
    const primary = {spec: row.spec, target_id: row.target_id};
    associations.set(associationKey(primary), primary);
    for (const association of row.target_associations ?? []) {
        associations.set(associationKey(association), association);
    }
    return [...associations.values()].sort((left, right) =>
        left.spec.localeCompare(right.spec) || left.target_id.localeCompare(right.target_id));
}

/** Adds non-primary target associations without duplicating references. */
export function addRowTargetAssociations(
    row: MetadataRow,
    additions: readonly TargetAssociation[]
): void {
    const primaryKey = associationKey({spec: row.spec, target_id: row.target_id});
    const associations = new Map(
        (row.target_associations ?? []).map(association => [associationKey(association), association])
    );
    for (const association of additions) {
        const key = associationKey(association);
        if (key !== primaryKey) associations.set(key, {...association});
    }
    row.target_associations = [...associations.values()].sort((left, right) =>
        left.spec.localeCompare(right.spec) || left.target_id.localeCompare(right.target_id));
}

/** Stable, training-facing metadata written into the released union dataset. */
export interface PublishedMetadataRow {
    file_name: string;
    tags: string[];
    solution: boolean;
}

/** Projects an operational standard row onto the compact public schema. */
export function toPublishedMetadataRow(row: MetadataRow): PublishedMetadataRow {
    if (!Array.isArray(row.tags) || !row.tags.every(tag => typeof tag === 'string')) {
        throw new Error(`Cannot publish metadata without string tags: ${row.sample_key}.`);
    }
    if (row.mode !== 'question' && row.mode !== 'solution') {
        throw new Error(`Cannot publish metadata with unknown mode "${row.mode}": ${row.sample_key}.`);
    }
    return {
        file_name: row.file_name,
        tags: [...row.tags],
        solution: row.mode === 'solution',
    };
}

/**
 * One exercise: every mode (question and solution) of the same
 * (target, generator, view, instance) within a split. Modes are independent
 * draws but belong to a single exercise, so they are kept or dropped together —
 * deduplicating individual rows could keep a question and drop its solution.
 */
export interface Exercise {
    key: string;
    view: string;
    /** The question row's fingerprint, matching what generation records as seen. */
    fingerprint: string;
    rows: MetadataRow[];
}

export const QUESTION_MODE = 'question';

/** Identity of the exercise a row belongs to, ignoring its mode. */
export function exerciseKey(row: MetadataRow): string {
    return [row.target_id, row.generator, row.view, row.instance].join('#');
}

/** Groups rows into exercises, preserving first-seen order. */
export function groupIntoExercises(rows: MetadataRow[]): Exercise[] {
    const byKey = new Map<string, Exercise>();

    for (const row of rows) {
        const key = exerciseKey(row);
        const existing = byKey.get(key);
        if (existing) {
            existing.rows.push(row);
            if (row.mode === QUESTION_MODE) existing.fingerprint = row.content_fingerprint;
        } else {
            byKey.set(key, {
                key,
                view: row.view,
                fingerprint: row.content_fingerprint,
                rows: [row],
            });
        }
    }

    return [...byKey.values()];
}

export type FingerprintIndex = Map<string, Set<string>>;

export function emptyFingerprintIndex(): FingerprintIndex {
    return new Map();
}

function has(index: FingerprintIndex | undefined, view: string, fingerprint: string): boolean {
    return index?.get(view)?.has(fingerprint) ?? false;
}

export interface MergeSelection {
    kept: Exercise[];
    dropped: Exercise[];
}

/**
 * Selects the exercises a standard contributes to the union, mutating `seen`
 * with the fingerprints it claims. `excluded` holds fingerprints that
 * disqualify an exercise without being claimed by it — the train index when
 * selecting the validation split, which keeps train content out of validation
 * across standards just as generation does within one.
 */
export function selectUnionExercises(
    exercises: Exercise[],
    seen: FingerprintIndex,
    excluded?: FingerprintIndex
): MergeSelection {
    const kept: Exercise[] = [];
    const dropped: Exercise[] = [];

    for (const exercise of exercises) {
        if (has(seen, exercise.view, exercise.fingerprint) || has(excluded, exercise.view, exercise.fingerprint)) {
            dropped.push(exercise);
            continue;
        }
        if (!seen.has(exercise.view)) seen.set(exercise.view, new Set());
        seen.get(exercise.view)!.add(exercise.fingerprint);
        kept.push(exercise);
    }

    return { kept, dropped };
}

/** Parses a `.jsonl` payload into metadata rows, ignoring blank lines. */
export function parseMetadataLines(content: string): MetadataRow[] {
    return content
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line) as MetadataRow);
}
