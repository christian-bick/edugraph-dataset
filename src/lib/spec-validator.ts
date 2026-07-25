import { CompetencyTarget } from '../types/ml-engine.ts';
import { loadTargets } from './generation.ts';
import { shortenLabel } from './utils.ts';

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
}

/**
 * Validates that all target IDs in the given target list are unique.
 * Returns an array of error messages for any duplicate IDs found.
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
 */
export function normalizeTargetLabels(targets: CompetencyTarget[]): CompetencyTarget[] {
    return targets.map(target => ({
        ...target,
        labels: Array.from(new Set(target.labels)).sort()
    }));
}

/**
 * Helper to extract the prefix from a target ID (e.g. "K.CC.B.5-how-many" from "K.CC.B.5-how-many-0").
 * If no numeric suffix exists, returns the full target ID.
 */
function getTargetPrefix(targetId: string): string {
    const lastDashIdx = targetId.lastIndexOf('-');
    if (lastDashIdx > 0 && /^\d+$/.test(targetId.slice(lastDashIdx + 1))) {
        return targetId.slice(0, lastDashIdx);
    }
    return targetId;
}

/**
 * Validates that permutations within a single target definition/prefix
 * (e.g. `K.CC.B.5-how-many-*`) have unique normalized label sets within itself.
 * Returns error strings if a single target definition generates duplicate permutations.
 */
export function validateUniquePermutationsPerTarget(targets: CompetencyTarget[]): string[] {
    const errors: string[] = [];

    // Group targets by prefix
    const targetsByPrefix = new Map<string, CompetencyTarget[]>();
    for (const target of targets) {
        const prefix = getTargetPrefix(target.id);
        if (!targetsByPrefix.has(prefix)) {
            targetsByPrefix.set(prefix, []);
        }
        targetsByPrefix.get(prefix)!.push(target);
    }

    // Check for duplicate permutations within each prefix group
    for (const [prefix, group] of targetsByPrefix.entries()) {
        const seenSignatures = new Map<string, string>();
        for (const target of group) {
            const signature = target.labels.join('|');
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
 * Validates that after label normalization, no two targets across the entire spec
 * have identical label permutations. Returns error strings if duplicate target permutations exist.
 */
export function validateUniqueTargetPermutations(targets: CompetencyTarget[]): string[] {
    const errors: string[] = [];
    const seenSignatures = new Map<string, string>();

    for (const target of targets) {
        const signature = target.labels.join('|');
        if (seenSignatures.has(signature)) {
            const shortenedLabels = target.labels.map(shortenLabel).join(', ');
            errors.push(
                `Duplicate permutation: "${target.id}" matches "${seenSignatures.get(signature)}". Labels: [${shortenedLabels}]`
            );
        } else {
            seenSignatures.set(signature, target.id);
        }
    }

    return errors;
}

/**
 * Deduplicates identical normalized label permutations across targets, keeping 1 representative target per label set.
 * Returns the deduplicated targets and warning strings detailing which targets were deduplicated.
 */
export function deduplicateTargetPermutations(targets: CompetencyTarget[]): {
    deduplicatedTargets: CompetencyTarget[];
    warnings: string[];
} {
    const warnings: string[] = [];
    const signatureToGroup = new Map<string, CompetencyTarget[]>();

    for (const target of targets) {
        const signature = target.labels.join('|');
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

export interface NormalizeAndValidateSpecOptions {
    specRoot?: string;
    /** If true, treats cross-target duplicate permutations as errors instead of warnings */
    failOnDuplicateTargetPermutations?: boolean;
}

/**
 * Loads, normalizes, validates, and deduplicates competency targets for a given spec module.
 */
export async function normalizeAndValidateSpec(
    specName: string,
    options: NormalizeAndValidateSpecOptions = {}
): Promise<SpecValidationResult> {
    const { specRoot, failOnDuplicateTargetPermutations = false } = options;

    const rawTargets = await loadTargets(specName, specRoot);
    const totalTargets = rawTargets.length;

    const errors: string[] = [];

    // 1. Validate Target ID uniqueness
    errors.push(...validateUniqueTargetIds(rawTargets));

    // 2. Normalize target label sets
    const normalizedTargets = normalizeTargetLabels(rawTargets);

    // 3. Validate unique permutations per target definition prefix
    errors.push(...validateUniquePermutationsPerTarget(normalizedTargets));

    // 4. Validate unique target permutations across spec (if configured as error)
    if (failOnDuplicateTargetPermutations) {
        errors.push(...validateUniqueTargetPermutations(normalizedTargets));
    }

    // 5. Deduplicate target permutations (collapsing identical label sets and logging warnings)
    const { deduplicatedTargets, warnings } = deduplicateTargetPermutations(normalizedTargets);

    const stats: SpecValidationStats = {
        totalTargets,
        uniqueTargets: deduplicatedTargets.length,
        deduplicatedCount: totalTargets - deduplicatedTargets.length
    };

    return {
        targets: deduplicatedTargets,
        errors,
        warnings,
        stats
    };
}
