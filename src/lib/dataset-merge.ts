/**
 * Union dataset merge logic.
 *
 * Each education standard generates into its own dataset folder; the union is
 * built by merging them in precedence order. Standards overlap heavily by
 * design, so the merge deduplicates content across them: the first standard to
 * contribute a given exercise keeps it, and later standards add only their
 * delta.
 *
 * Dedup mirrors the generation-time rule (`generateModuleSamples`): scoped per
 * (split, view) by content fingerprint, with the validation split additionally
 * rejecting content already present in train.
 */

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
    [key: string]: unknown;
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
