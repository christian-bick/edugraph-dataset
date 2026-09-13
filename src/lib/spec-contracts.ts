import {Ability} from 'edugraph-ts';
import {getCapabilityAncestors} from './ontology.ts';
import {radixSortUtf8} from './content-identity.ts';
import type {CompatibleModulePairIndex, ViewMatchInfo} from './matching.ts';
import type {WorkCounters} from './work-counters.ts';

const abilityLabels = new Set<string>(Object.values(Ability));

export function findAbilityLabels(labels: readonly string[]): string[] {
    return labels.filter(label => abilityLabels.has(label));
}

export interface RequiredLabelPair {
    generatorId: string;
    /** Existing pair-index closure, including capabilities supplied by either role. */
    supportedTargetLabels: ReadonlySet<string>;
}

export type RequiredLabelContractIssue =
    | {kind: 'required-and-rejected-label'; label: string; rejectedLabel: string}
    | {kind: 'no-compatible-generator'}
    | {kind: 'pair-missing-required-label'; generatorId: string; label: string};

export type RejectedLabelContractIssue =
    {kind: 'ability-rejection'; label: string};

/**
 * Rejections express stable, complete exclusion boundaries. They never filter Abilities.
 * Area/Scope limits may intentionally be forward-compatible with generators that
 * do not currently establish them, so their present matching effect is not part
 * of this static contract.
 */
export function findRejectedLabelContractIssues({
    rejectedLabels
}: {
    rejectedLabels: readonly string[];
}): RejectedLabelContractIssue[] {
    return findAbilityLabels(radixSortUtf8([...new Set(rejectedLabels)]))
        .map(label => ({kind: 'ability-rejection' as const, label}));
}

/**
 * Required labels are dimension-neutral target preconditions. Every compatible
 * generator/view pair must be capable of satisfying each requirement.
 */
export function findRequiredLabelContractIssues({
    requiredLabels,
    rejectedLabels,
    compatiblePairs,
    counters,
    ancestorsOf = getCapabilityAncestors
}: {
    requiredLabels: readonly string[];
    rejectedLabels: readonly string[];
    compatiblePairs: readonly RequiredLabelPair[];
    counters?: WorkCounters;
    ancestorsOf?: typeof getCapabilityAncestors;
}): RequiredLabelContractIssue[] {
    if (requiredLabels.length === 0) return [];

    const issues: RequiredLabelContractIssue[] = [];
    const requirements = radixSortUtf8([...new Set(requiredLabels)]);
    const rejected = new Set(rejectedLabels);
    counters?.add('applicability.requirements', requirements.length);
    counters?.add('applicability.rejections', rejected.size);
    for (const requiredLabel of requirements) {
        if (rejected.size === 0) break;
        const conflicts: string[] = [];
        for (const ancestor of ancestorsOf(requiredLabel)) {
            counters?.add('applicability.rejection_lookups');
            if (rejected.has(ancestor)) conflicts.push(ancestor);
        }
        for (const rejectedLabel of radixSortUtf8(conflicts)) {
            issues.push({kind: 'required-and-rejected-label', label: requiredLabel, rejectedLabel});
        }
    }

    if (compatiblePairs.length === 0) {
        issues.push({kind: 'no-compatible-generator'});
        return issues;
    }

    const pairsByGenerator = new Map(compatiblePairs.map(pair => [pair.generatorId, pair]));
    for (const generatorId of radixSortUtf8([...pairsByGenerator.keys()])) {
        const pair = pairsByGenerator.get(generatorId)!;
        for (const requiredLabel of requirements) {
            counters?.add('applicability.support_lookups');
            if (!pair.supportedTargetLabels.has(requiredLabel)) {
                issues.push({
                    kind: 'pair-missing-required-label',
                    generatorId,
                    label: requiredLabel
                });
            }
        }
    }

    return issues;
}

export type ApplicabilityIssue = (RequiredLabelContractIssue | RejectedLabelContractIssue) & {
    viewId: string;
    rule_ids: string[];
    message: string;
};

function applicabilityIssue(viewId: string, issue: RequiredLabelContractIssue | RejectedLabelContractIssue): ApplicabilityIssue {
    let rule_ids: string[];
    let detail: string;
    switch (issue.kind) {
        case 'required-and-rejected-label':
            rule_ids = ['SPEC-V3', 'SPEC-V7'];
            detail = `requiredLabels '${issue.label}' is excluded by rejectedLabels '${issue.rejectedLabel}' through equality or specialization`;
            break;
        case 'no-compatible-generator':
            rule_ids = ['SPEC-V7'];
            detail = 'requiredLabels cannot be established because the view has no compatible generator';
            break;
        case 'pair-missing-required-label':
            rule_ids = ['SPEC-V7'];
            detail = `requiredLabels '${issue.label}' is not supported by compatible pair '${issue.generatorId}#${viewId}'`;
            break;
        case 'ability-rejection':
            rule_ids = ['SPEC-V3'];
            detail = `rejectedLabels '${issue.label}' is an Ability; rejection boundaries cannot exclude Abilities`;
            break;
    }
    return {...issue, viewId, rule_ids, message: `${rule_ids.join('/')} [view:${viewId}] ${detail}`};
}

/** D5 uses the same current compatible pairs and capability closures as production matching. */
export function inspectApplicability(options: {
    views: readonly ViewMatchInfo[];
    pairIndex: CompatibleModulePairIndex;
    counters?: WorkCounters;
}): ApplicabilityIssue[] {
    const pairsByView = new Map<string, RequiredLabelPair[]>();
    for (const pair of options.pairIndex.orderedPairs) {
        const entry = {generatorId: pair.generator.generatorId, supportedTargetLabels: pair.supportedTargetLabels};
        const group = pairsByView.get(pair.view.viewId);
        if (group) group.push(entry);
        else pairsByView.set(pair.view.viewId, [entry]);
        options.counters?.add('applicability.pair_index_entries');
    }
    const issues: ApplicabilityIssue[] = [];
    const viewsById = new Map(options.views.map(view => [view.viewId, view]));
    for (const viewId of radixSortUtf8([...viewsById.keys()])) {
        const view = viewsById.get(viewId)!;
        options.counters?.add('applicability.views');
        const contracts = [
            ...findRequiredLabelContractIssues({
                requiredLabels: view.requiredLabels ?? [], rejectedLabels: view.rejectedLabels ?? [],
                compatiblePairs: pairsByView.get(viewId) ?? [], counters: options.counters
            }),
            ...findRejectedLabelContractIssues({rejectedLabels: view.rejectedLabels ?? []})
        ];
        issues.push(...contracts.map(issue => applicabilityIssue(viewId, issue)));
        options.counters?.add('applicability.issues', contracts.length);
    }
    return issues;
}
