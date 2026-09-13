import {Ability, Area, bundledContext} from 'edugraph-ts/generated';
import type {OntologyContext} from 'edugraph-ts/core';
import type {ConfigSchema} from '../types/schema.ts';
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
    requiredLabels?: readonly string[];
    rejectedLabels?: readonly string[];
    schema?: ConfigSchema;
}, location: string): string[] {
    const errors: string[] = [];
    for (const field of ['generalLabels', 'requiredLabels', 'rejectedLabels'] as const) {
        errors.push(...labelContractIndex.validate(spec[field] ?? [], `${location}.${field}`));
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
