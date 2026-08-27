import {Ability, Area} from 'edugraph-ts';
import {capabilitySatisfies} from './ontology.ts';

const abilityLabels = new Set<string>(Object.values(Ability));
const areaLabels = new Set<string>(Object.values(Area));

export function findAbilityLabels(labels: readonly string[]): string[] {
    return labels.filter(label => abilityLabels.has(label));
}

export type CrossRoleAreaOverlap = {generatorLabel: string; viewLabel: string};

export function findCrossRoleAreaOverlaps({
    generatorLabels,
    viewLabels
}: {
    generatorLabels: readonly string[];
    viewLabels: readonly string[];
}): CrossRoleAreaOverlap[] {
    const generatorAreas = generatorLabels.filter(label => areaLabels.has(label));
    const viewAreas = viewLabels.filter(label => areaLabels.has(label));
    return viewAreas.flatMap(viewLabel => generatorAreas
        .filter(generatorLabel => capabilitySatisfies(viewLabel, generatorLabel)
            || capabilitySatisfies(generatorLabel, viewLabel))
        .map(generatorLabel => ({generatorLabel, viewLabel})));
}

export interface CompatibleGeneratorLabels {
    generatorId: string;
    supportedLabels: readonly string[];
}

export type RequiredLabelContractIssue =
    | {kind: 'required-and-rejected-label'; label: string}
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
    return findAbilityLabels(rejectedLabels)
        .map(label => ({kind: 'ability-rejection' as const, label}));
}

/**
 * Required labels are dimension-neutral target preconditions. Every compatible
 * generator/view pair must be capable of satisfying each requirement.
 */
export function findRequiredLabelContractIssues({
    requiredLabels,
    viewSupportedLabels,
    rejectedLabels,
    compatibleGenerators
}: {
    requiredLabels: readonly string[];
    viewSupportedLabels: readonly string[];
    rejectedLabels: readonly string[];
    compatibleGenerators: readonly CompatibleGeneratorLabels[];
}): RequiredLabelContractIssue[] {
    if (requiredLabels.length === 0) return [];

    const issues: RequiredLabelContractIssue[] = [];
    for (const requiredLabel of requiredLabels) {
        if (rejectedLabels.includes(requiredLabel)) {
            issues.push({kind: 'required-and-rejected-label', label: requiredLabel});
        }
    }

    if (compatibleGenerators.length === 0) {
        issues.push({kind: 'no-compatible-generator'});
        return issues;
    }

    for (const generator of compatibleGenerators) {
        for (const requiredLabel of requiredLabels) {
            const suppliedByPair = [
                ...generator.supportedLabels,
                ...viewSupportedLabels
            ].some(supportedLabel =>
                capabilitySatisfies(supportedLabel, requiredLabel)
            );
            if (!suppliedByPair) {
                issues.push({
                    kind: 'pair-missing-required-label',
                    generatorId: generator.generatorId,
                    label: requiredLabel
                });
            }
        }
    }

    return issues;
}
