import { CompetencyTarget, TargetEquivalence } from '../types/ml-engine.ts';
import { loadTargets, loadSpecEquivalences } from './generation.ts';
import { shortenLabel, labelSetKey } from './utils.ts';

export { labelSetKey };

export interface SpecValidationStats {
    totalTargets: number;
    uniqueTargets: number;
    deduplicatedCount: number;
}

export interface SpecValidationResult {
    targets: CompetencyTarget[];
    errors: string[];
    warnings: string[];
    stats: SpecValidationStats;
    /** Deliberate cross-definition equivalences honored during validation. */
    equivalences: TargetEquivalence[];
}

export interface LoadMatchingTargetsOptions {
    /** Read source target definitions without normalization or overlap deduplication. */
    raw?: boolean;
    specRoot?: string;
}

/**
 * Loads the target set used by matching diagnostics. By default this is the
 * same normalized, overlap-deduplicated set used by dataset generation.
 * `raw` is an explicit diagnostic escape hatch for inspecting source
 * definitions before production normalization.
 */
export async function loadMatchingTargets(
    specName: string,
    options: LoadMatchingTargetsOptions = {}
): Promise<CompetencyTarget[]> {
    if (options.raw) {
        return loadTargets(specName, options.specRoot);
    }

    const result = await normalizeAndValidateSpec(specName, options.specRoot);
    if (result.errors.length > 0) {
        throw new Error(
            `Spec module "${specName}" has ${result.errors.length} validation error(s):\n` +
            result.errors.map(error => `- ${error}`).join('\n')
        );
    }
    return result.targets;
}

/**
 * Extracts the target definition prefix from a target ID by stripping the
 * `~<labelSetHash>` permutation suffix that `toTargets` appends (e.g.
 * "K.CC.B.5-how-many~a3f91c2e" -> "K.CC.B.5-how-many"). An ID without a
 * `~` separator is treated as its own definition.
 */
export function getTargetPrefix(targetId: string): string {
    const sepIdx = targetId.lastIndexOf('~');
    return sepIdx > 0 ? targetId.slice(0, sepIdx) : targetId;
}

function groupTargetsByPrefix(targets: CompetencyTarget[]): Map<string, CompetencyTarget[]> {
    const targetsByPrefix = new Map<string, CompetencyTarget[]>();
    for (const target of targets) {
        const prefix = getTargetPrefix(target.id);
        if (!targetsByPrefix.has(prefix)) {
            targetsByPrefix.set(prefix, []);
        }
        targetsByPrefix.get(prefix)!.push(target);
    }
    return targetsByPrefix;
}

/**
 * Validates that all target IDs in the given target list are unique.
 * Returns an array of error messages for any duplicate IDs found.
 * This is the sole gatekeeper for target ID uniqueness — `loadTargets`
 * itself is permissive.
 */
export function validateUniqueTargetIds(targets: CompetencyTarget[]): string[] {
    const errors: string[] = [];
    const seenIds = new Set<string>();

    for (const target of targets) {
        if (seenIds.has(target.id)) {
            errors.push(`Duplicate target ID "${target.id}" found in spec.`);
        }
        seenIds.add(target.id);
    }

    return errors;
}

/**
 * Normalizes label arrays for every target by sorting and deduplicating labels.
 * Returns new target objects; the input targets are not mutated.
 */
export function normalizeTargetLabels(targets: CompetencyTarget[]): CompetencyTarget[] {
    return targets.map(target => ({
        ...target,
        labels: Array.from(new Set(target.labels)).sort()
    }));
}

/**
 * Validates that permutations within a single target definition
 * (e.g. `K.CC.B.5-how-many-*`) have unique label sets within itself.
 * Returns error strings if a single target definition generates duplicate permutations.
 */
export function validateUniquePermutationsPerTarget(targets: CompetencyTarget[]): string[] {
    const errors: string[] = [];

    for (const [prefix, group] of groupTargetsByPrefix(targets).entries()) {
        const seenSignatures = new Map<string, string>();
        for (const target of group) {
            const signature = labelSetKey(target.labels);
            if (seenSignatures.has(signature)) {
                const shortenedLabels = target.labels.map(shortenLabel).join(', ');
                errors.push(
                    `Target "${prefix}": duplicate permutations in "${target.id}" and "${seenSignatures.get(signature)}". Labels: [${shortenedLabels}]`
                );
            } else {
                seenSignatures.set(signature, target.id);
            }
        }
    }

    return errors;
}

/**
 * Validates that every target definition is distinctly described by the
 * ontology: no two definitions may define the exact same *set* of label
 * permutations. Definitions may overlap in individual permutations — that is
 * expected between related standards and is handled by
 * `deduplicateTargetPermutations` — but fully identical permutation sets
 * make the definitions indistinguishable and are errors.
 *
 * A collision is *not* an error when both definitions are declared members of
 * the same `equivalentGroups` entry: such identity is a deliberate,
 * documented decision (see `TargetEquivalence`) rather than a modelling
 * mistake. The first definition of each identical set is kept as the
 * representative, exactly as the generation pipeline's dedup already does.
 */
export function validateUniqueTargetPermutations(
    targets: CompetencyTarget[],
    equivalentGroups: readonly (readonly string[])[] = []
): string[] {
    const errors: string[] = [];
    const seenSetKeys = new Map<string, string>();

    const groupOfPrefix = new Map<string, number>();
    equivalentGroups.forEach((group, idx) => {
        for (const prefix of group) {
            if (!groupOfPrefix.has(prefix)) groupOfPrefix.set(prefix, idx);
        }
    });
    const areDeclaredEquivalent = (a: string, b: string): boolean => {
        const groupA = groupOfPrefix.get(a);
        return groupA !== undefined && groupA === groupOfPrefix.get(b);
    };

    for (const [prefix, group] of groupTargetsByPrefix(targets).entries()) {
        const permutationKeys = Array.from(new Set(group.map(t => labelSetKey(t.labels)))).sort();
        const setKey = JSON.stringify(permutationKeys);
        const seenPrefix = seenSetKeys.get(setKey);
        if (seenPrefix !== undefined) {
            if (areDeclaredEquivalent(seenPrefix, prefix)) {
                continue;
            }
            errors.push(
                `Target definitions "${seenPrefix}" and "${prefix}" define identical permutation sets ` +
                `(${permutationKeys.length} permutation(s)) — they are not distinguishable by the ontology.`
            );
        } else {
            seenSetKeys.set(setKey, prefix);
        }
    }

    return errors;
}

/**
 * Cross-checks declared target equivalences against the actual normalized
 * targets, returning warnings for declarations that are stale (the definitions
 * no longer share an identical permutation set) or that reference unknown
 * definition prefixes. This keeps an equivalence declaration from silently
 * masking a genuine divergence introduced by a later spec edit.
 */
export function validateDeclaredEquivalences(
    targets: CompetencyTarget[],
    equivalences: readonly TargetEquivalence[]
): string[] {
    const setKeyByPrefix = new Map<string, string>();
    for (const [prefix, group] of groupTargetsByPrefix(targets).entries()) {
        const permutationKeys = Array.from(new Set(group.map(t => labelSetKey(t.labels)))).sort();
        setKeyByPrefix.set(prefix, JSON.stringify(permutationKeys));
    }

    const warnings: string[] = [];
    for (const eq of equivalences) {
        const missing = eq.targets.filter(prefix => !setKeyByPrefix.has(prefix));
        if (missing.length > 0) {
            warnings.push(
                `Declared equivalence [${eq.targets.join(', ')}] references unknown target definition(s): ${missing.join(', ')}.`
            );
            continue;
        }
        const distinctSetKeys = new Set(eq.targets.map(prefix => setKeyByPrefix.get(prefix)));
        if (distinctSetKeys.size > 1) {
            warnings.push(
                `Declared equivalence [${eq.targets.join(', ')}] is stale: the definitions no longer share an identical permutation set.`
            );
        }
    }
    return warnings;
}

/**
 * Deduplicates identical label permutations across targets, keeping 1 representative target per label set.
 * Returns the deduplicated targets and warning strings detailing which targets were deduplicated.
 */
export function deduplicateTargetPermutations(targets: CompetencyTarget[]): {
    deduplicatedTargets: CompetencyTarget[];
    warnings: string[];
} {
    const warnings: string[] = [];
    const signatureToGroup = new Map<string, CompetencyTarget[]>();

    for (const target of targets) {
        const signature = labelSetKey(target.labels);
        if (!signatureToGroup.has(signature)) {
            signatureToGroup.set(signature, []);
        }
        signatureToGroup.get(signature)!.push(target);
    }

    const deduplicatedTargets: CompetencyTarget[] = [];

    let clusterIdx = 1;
    for (const [_, group] of signatureToGroup.entries()) {
        deduplicatedTargets.push(group[0]);

        if (group.length > 1) {
            const duplicateIds = group.map(t => t.id).join(', ');
            const shortenedLabels = group[0].labels.map(shortenLabel).join(', ');
            warnings.push(
                `[Cluster #${clusterIdx}] ${group.length} targets share labels (${duplicateIds}) -> primary "${group[0].id}". Labels: [${shortenedLabels}]`
            );
            clusterIdx++;
        }
    }

    return { deduplicatedTargets, warnings };
}

/**
 * Loads, normalizes, validates, and deduplicates competency targets for a
 * given spec module. Every validation always runs; there are no opt-in
 * strictness flags.
 */
export async function normalizeAndValidateSpec(
    specName: string,
    specRoot?: string
): Promise<SpecValidationResult> {
    const [rawTargets, equivalences] = await Promise.all([
        loadTargets(specName, specRoot),
        loadSpecEquivalences(specName, specRoot)
    ]);
    const totalTargets = rawTargets.length;

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate Target ID uniqueness
    errors.push(...validateUniqueTargetIds(rawTargets));

    // 2. Normalize target label sets
    const normalizedTargets = normalizeTargetLabels(rawTargets);

    // 3. Validate unique permutations per target definition
    errors.push(...validateUniquePermutationsPerTarget(normalizedTargets));

    // 4. Validate that no two target definitions share an identical permutation
    //    set, except where a deliberate equivalence is declared.
    errors.push(...validateUniqueTargetPermutations(normalizedTargets, equivalences.map(e => e.targets)));

    // 4b. Flag equivalence declarations that no longer hold (stale/unknown).
    warnings.push(...validateDeclaredEquivalences(normalizedTargets, equivalences));

    // 5. Deduplicate overlapping permutations across targets (warnings, not errors)
    const { deduplicatedTargets, warnings: dedupWarnings } = deduplicateTargetPermutations(normalizedTargets);
    warnings.push(...dedupWarnings);

    const stats: SpecValidationStats = {
        totalTargets,
        uniqueTargets: deduplicatedTargets.length,
        deduplicatedCount: totalTargets - deduplicatedTargets.length
    };

    return {
        targets: deduplicatedTargets,
        errors,
        warnings,
        stats,
        equivalences
    };
}
