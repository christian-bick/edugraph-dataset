import {isSubConceptOf} from './ontology.ts';

export interface CompatibleGeneratorLabels {
    generatorId: string;
    supportedLabels: readonly string[];
}

export type RequiredLabelContractIssue =
    | {kind: 'view-provides-required-label'; label: string; viewLabel: string}
    | {kind: 'required-and-rejected-label'; label: string}
    | {kind: 'no-compatible-generator'}
    | {kind: 'generator-missing-required-label'; generatorId: string; label: string};

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
