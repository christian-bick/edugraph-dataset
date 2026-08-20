import {Ability, Area, Scope} from 'edugraph-ts';
import {isSubConceptOf} from './ontology.ts';

const abilityLabels = new Set<string>(Object.values(Ability));
const applicabilityLabels = new Set<string>([
    ...Object.values(Area),
    ...Object.values(Scope)
]);
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
        .filter(generatorLabel => isSubConceptOf(viewLabel, generatorLabel)
            || isSubConceptOf(generatorLabel, viewLabel))
        .map(generatorLabel => ({generatorLabel, viewLabel})));
}

export interface CompatibleGeneratorLabels {
    generatorId: string;
    supportedLabels: readonly string[];
}

export type RequiredLabelContractIssue =
    | {kind: 'invalid-required-label-kind'; label: string}
    | {kind: 'view-provides-required-label'; label: string; viewLabel: string}
    | {kind: 'required-and-rejected-label'; label: string}
    | {kind: 'no-compatible-generator'}
    | {kind: 'generator-missing-required-label'; generatorId: string; label: string};

export type RejectedLabelContractIssue =
    {kind: 'ability-rejection'; label: string};

/**
 * Rejections express physical rendering boundaries. They never filter Abilities.
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
 * Required labels are applicability preconditions supplied by every compatible
 * generator, never capabilities supplied by the view itself.
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
        if (!applicabilityLabels.has(requiredLabel)) {
            issues.push({kind: 'invalid-required-label-kind', label: requiredLabel});
        }

        const providingViewLabel = viewSupportedLabels.find(viewLabel =>
            isSubConceptOf(viewLabel, requiredLabel)
        );
        if (providingViewLabel) {
            issues.push({
                kind: 'view-provides-required-label',
                label: requiredLabel,
                viewLabel: providingViewLabel
            });
        }

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
            const suppliedByGenerator = generator.supportedLabels.some(generatorLabel =>
                isSubConceptOf(generatorLabel, requiredLabel)
            );
            if (!suppliedByGenerator) {
                issues.push({
                    kind: 'generator-missing-required-label',
                    generatorId: generator.generatorId,
                    label: requiredLabel
                });
            }
        }
    }

    return issues;
}
