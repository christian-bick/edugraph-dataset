import { CompetencyTarget, TargetEquivalence } from '../types/ml-engine.ts';
import { getTargetPrefix } from './spec-validator.ts';
import { labelSetKey, shortenLabel } from './utils.ts';

export type DistinctnessRelation = 'identical' | 'contained' | 'overlapping' | 'adjacent';

export interface TargetDistinctnessFinding {
    left: string;
    right: string;
    relation: DistinctnessRelation;
    leftPermutations: number;
    rightPermutations: number;
    sharedPermutations: number;
    minimumLabelDelta: number;
    leftStableDiscriminators: string[];
    rightStableDiscriminators: string[];
    declaredEquivalent: boolean;
}

interface Definition {
    prefix: string;
    permutations: string[][];
    permutationKeys: Set<string>;
    stableLabels: Set<string>;
    allLabels: Set<string>;
}

function intersection(values: string[][]): Set<string> {
    if (values.length === 0) return new Set();
    return new Set(values[0].filter(value => values.every(group => group.includes(value))));
}

function definitions(targets: CompetencyTarget[]): Definition[] {
    const grouped = new Map<string, string[][]>();
    for (const target of targets) {
        const prefix = getTargetPrefix(target.id);
        if (!grouped.has(prefix)) grouped.set(prefix, []);
        grouped.get(prefix)!.push([...new Set(target.labels)].sort());
    }
    return [...grouped.entries()]
        .map(([prefix, permutations]) => ({
            prefix,
            permutations,
            permutationKeys: new Set(permutations.map(labelSetKey)),
            stableLabels: intersection(permutations),
            allLabels: new Set(permutations.flat())
        }))
        .sort((a, b) => a.prefix.localeCompare(b.prefix));
}

function minimumLabelDelta(left: string[][], right: string[][]): number {
    let minimum = Number.POSITIVE_INFINITY;
    for (const leftLabels of left) {
        const leftSet = new Set(leftLabels);
        for (const rightLabels of right) {
            const rightSet = new Set(rightLabels);
            const delta = leftLabels.filter(label => !rightSet.has(label)).length
                + rightLabels.filter(label => !leftSet.has(label)).length;
            minimum = Math.min(minimum, delta);
        }
    }
    return minimum;
}

function subsetOf(left: Set<string>, right: Set<string>): boolean {
    return [...left].every(value => right.has(value));
}

function declaredEquivalent(left: string, right: string, equivalences: readonly TargetEquivalence[]): boolean {
    return equivalences.some(group => group.targets.includes(left) && group.targets.includes(right));
}

export function analyzeTargetDistinctness(
    targets: CompetencyTarget[],
    equivalences: readonly TargetEquivalence[] = []
): TargetDistinctnessFinding[] {
    const groups = definitions(targets);
    const findings: TargetDistinctnessFinding[] = [];

    for (let leftIndex = 0; leftIndex < groups.length; leftIndex++) {
        for (let rightIndex = leftIndex + 1; rightIndex < groups.length; rightIndex++) {
            const left = groups[leftIndex];
            const right = groups[rightIndex];
            const shared = [...left.permutationKeys].filter(key => right.permutationKeys.has(key)).length;
            const delta = minimumLabelDelta(left.permutations, right.permutations);
            const identical = left.permutationKeys.size === right.permutationKeys.size
                && shared === left.permutationKeys.size;
            const contained = subsetOf(left.permutationKeys, right.permutationKeys)
                || subsetOf(right.permutationKeys, left.permutationKeys);
            const relation: DistinctnessRelation | null = identical
                ? 'identical'
                : contained && shared > 0
                    ? 'contained'
                    : shared > 0
                        ? 'overlapping'
                        : delta <= 1
                            ? 'adjacent'
                            : null;
            if (!relation) continue;

            findings.push({
                left: left.prefix,
                right: right.prefix,
                relation,
                leftPermutations: left.permutationKeys.size,
                rightPermutations: right.permutationKeys.size,
                sharedPermutations: shared,
                minimumLabelDelta: delta,
                leftStableDiscriminators: [...left.stableLabels]
                    .filter(label => !right.allLabels.has(label))
                    .sort(),
                rightStableDiscriminators: [...right.stableLabels]
                    .filter(label => !left.allLabels.has(label))
                    .sort(),
                declaredEquivalent: declaredEquivalent(left.prefix, right.prefix, equivalences)
            });
        }
    }

    const rank: Record<DistinctnessRelation, number> = {
        identical: 0,
        contained: 1,
        overlapping: 2,
        adjacent: 3
    };
    return findings.sort((a, b) =>
        rank[a.relation] - rank[b.relation]
        || a.left.localeCompare(b.left)
        || a.right.localeCompare(b.right));
}

function labels(values: string[]): string {
    return values.length > 0 ? values.map(shortenLabel).join(', ') : '—';
}

export function renderTargetDistinctnessMarkdown(
    specName: string,
    targets: CompetencyTarget[],
    findings: TargetDistinctnessFinding[]
): string {
    const definitionCount = new Set(targets.map(target => getTargetPrefix(target.id))).size;
    const counts = (['identical', 'contained', 'overlapping', 'adjacent'] as const)
        .map(relation => `- ${relation}: ${findings.filter(finding => finding.relation === relation).length}`)
        .join('\n');
    const table = findings.length === 0
        ? '_No potentially confusable target definitions found._'
        : [
            '| Relation | Definitions | Permutations | Shared | Min label delta | Stable discriminators | Equivalent? |',
            '|---|---|---:|---:|---:|---|---|',
            ...findings.map(finding =>
                `| ${finding.relation} | \`${finding.left}\` ↔ \`${finding.right}\` ` +
                `| ${finding.leftPermutations} / ${finding.rightPermutations} ` +
                `| ${finding.sharedPermutations} | ${finding.minimumLabelDelta} ` +
                `| L: ${labels(finding.leftStableDiscriminators)}<br>R: ${labels(finding.rightStableDiscriminators)} ` +
                `| ${finding.declaredEquivalent ? 'yes' : 'no'} |`
            )
        ].join('\n');

    return [
        `# Target Distinctness Analysis: ${specName}`,
        '',
        'This report is advisory. It highlights definitions that are identical, contain or overlap one another, or come within one ontology label of each other. A finding is a review prompt, not a validation failure.',
        '',
        `Definitions analyzed: ${definitionCount}`,
        '',
        counts,
        '',
        'Stable discriminators are labels required by every permutation on one side and absent from every permutation on the other. An empty discriminator is not automatically wrong, but deserves semantic review.',
        '',
        table,
        ''
    ].join('\n');
}
