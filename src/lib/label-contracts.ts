import {Ability, Area, bundledContext} from 'edugraph-ts/generated';
import type {OntologyContext} from 'edugraph-ts/core';
import type {ConfigSchema} from '../types/schema.ts';
import type {CompatibilityRule} from '../types/compatibility.ts';
import {getCapabilityAncestors} from './ontology.ts';

/** Translate shared ontology eligibility into dataset diagnostics over one complete snapshot. */
export function createLabelContractIndex(context: Pick<OntologyContext, 'inspectLabel'> = bundledContext) {
    return {
        validate(labels: readonly string[], location: string): string[] {
            return labels.flatMap(label => {
                const eligibility = context.inspectLabel(label);
                if (eligibility.status === 'unknown') return [`SPEC-3 ${location}: unknown descriptor '${label}'.`];
                return eligibility.eligible ? []
                    : [`SPEC-3 ${location}: '${label}' has constituent children and is ineligible.`];
            });
        }
    };
}

export const labelContractIndex = createLabelContractIndex();
const areas = new Set<string>(Object.values(Area));
const abilities = new Set<string>(Object.values(Ability));

export function validateTargetLabelContract(labels: readonly string[], location: string): string[] {
    const errors = labelContractIndex.validate(labels, location);
    if (!labels.some(label => areas.has(label))) errors.push(`TSPEC-14 ${location}: missing Area.`);
    if (!labels.some(label => abilities.has(label))) errors.push(`TSPEC-14 ${location}: missing Ability.`);
    return errors;
}

export function validateModuleLabelContract(spec: {
    generalLabels?: readonly string[];
    compatibility?: readonly CompatibilityRule<any>[];
    schema?: ConfigSchema;
}, location: string): string[] {
    const errors: string[] = [];
    for (const field of ['requiredLabels', 'rejectedLabels']) {
        if (field in spec) errors.push(`SPEC-V4 ${location}.${field}: removed declaration; use compatibility target policies.`);
    }
    errors.push(...labelContractIndex.validate(spec.generalLabels ?? [], `${location}.generalLabels`));
    for (const rule of spec.compatibility ?? []) {
        errors.push(...labelContractIndex.validate((rule.dependencies ?? []).map(dependency => dependency.label),
            `${location}.compatibility.${rule.id}`));
    }
    for (const [field, choice] of Object.entries(spec.schema ?? {})) {
        if (!Array.isArray(choice)) continue;
        const tuple = Array.isArray(choice[0]);
        errors.push(...labelContractIndex.validate(tuple ? choice[0] : choice, `${location}.schema.${field}`));
        if (tuple && choice.length > 2) {
            for (const fallback of choice[2]) {
                errors.push(...labelContractIndex.validate(fallback, `${location}.schema.${field}.fallback`));
            }
        }
        const contract = tuple ? choice[1].labelChoices : undefined;
        if (contract) {
            const labels = [...(contract.contextLabels ?? [])];
            if (contract.kind === 'alternatives') {
                labels.push(...(contract.alternatives ?? []).flat(), ...(contract.equivalenceGroups ?? []).flat(2));
                for (const entry of contract.defaults ?? []) labels.push(...entry.labels, ...(entry.whenAll ?? []), ...(entry.whenNone ?? []));
            } else labels.push(...(contract.predicate?.all ?? []));
            errors.push(...labelContractIndex.validate([...new Set(labels)], `${location}.schema.${field}.choices`));
        }
    }
    return errors;
}

/** A contract failure must bypass generator retry and solution fallback handling. */
export class ResolvedLabelContractError extends Error {}

/** Validate each actual draw before rendering or transferring its target association. */
export function assertResolvedTargetCoverage(labels: readonly string[], requested: readonly string[], location: string): void {
    const errors = labelContractIndex.validate(labels, `${location}.annotations`);
    const provided = new Set<string>();
    for (const label of labels) for (const ancestor of getCapabilityAncestors(label)) provided.add(ancestor);
    for (const label of requested) {
        if (!provided.has(label)) errors.push(`SPEC-1 ${location}: resolved annotations do not satisfy '${label}'.`);
    }
    if (errors.length) throw new ResolvedLabelContractError(errors.join('\n'));
}
