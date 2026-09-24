import type {CompatibilityRule} from '../types/compatibility.ts';
import {CompatibilityContractError} from './compatibility-errors.ts';

const canonical = (labels: readonly string[]): string[] => [...new Set(labels)].sort();

function policyLabels(labels: readonly string[], description: string): string[] {
    if (!Array.isArray(labels)) throw new CompatibilityContractError(`${description} must be an array`);
    labels.forEach((label, index) => {
        if (typeof label !== 'string' || label.length === 0) {
            throw new CompatibilityContractError(`${description}[${index}] must be a nonempty string`);
        }
    });
    return canonical(labels);
}

/** Positive target policies are conjunctions over the original request. */
export function requireTargetLabels(id: string, labels: readonly string[]): CompatibilityRule<'target'> {
    const requested = policyLabels(labels, 'Required labels');
    return {
        id,
        targetPolicy: {kind: 'require', labels: requested},
        dependencies: requested.map(label => ({scope: 'target', label})),
        predicate: context => requested.every(label => context.has('target', label))
    };
}

/** Negative policies reject a target that requests any listed capability. */
export function rejectTargetLabels(id: string, labels: readonly string[]): CompatibilityRule<'target'> {
    const rejected = policyLabels(labels, 'Rejected labels');
    return {
        id,
        targetPolicy: {kind: 'reject', labels: rejected},
        dependencies: rejected.map(label => ({scope: 'target', label})),
        predicate: context => rejected.every(label => !context.has('target', label))
    };
}

/** Reads authored helper policies for audits; predicates alone decide compatibility. */
export function getTargetPolicyLabels(rules: readonly CompatibilityRule<any>[] | undefined, kind: 'require' | 'reject'): string[] {
    return canonical((rules ?? []).flatMap(rule => rule.targetPolicy?.kind === kind ? [...rule.targetPolicy.labels] : []));
}
