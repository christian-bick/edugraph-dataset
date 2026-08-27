import { OntologyNeutralResolverFn, ResolverFn } from '../types/schema.ts';
import { capabilitySatisfies } from './ontology.ts';

/**
 * Marks a function-only schema choice as independent of ontology labels.
 * Use this only for deterministic seeded configuration that contributes no capability label.
 */
export const ontologyNeutral = <T>(resolver: () => T): OntologyNeutralResolverFn<T> =>
    Object.assign(resolver, {ontologyNeutral: true as const});

export const hasLabel = (targetLabel: string): ResolverFn<boolean> => {
    return (labels: string[]) => labels.includes(targetLabel);
};

export const hasCapability = (targetLabel: string): ResolverFn<boolean> => {
    return (labels: string[]) => labels.some(label => capabilitySatisfies(label, targetLabel));
};

export const matchAllCapabilities = (targetLabels: readonly string[]): ResolverFn<string[]> => {
    return (labels: string[]) => targetLabels.filter(target =>
        labels.some(label => capabilitySatisfies(label, target)));
};

export const selectExactMatch = (labels: string[], supportedLabels?: readonly string[]): string | undefined => {
    return supportedLabels?.find(s => labels.includes(s));
};

export const matchAllExactLabels = (labels: string[], supportedLabels?: readonly string[]): string[] => {
    if (!supportedLabels) return [];
    return supportedLabels.filter(s => labels.includes(s));
};

export const selectCanonicalLabel = <T extends string>(
    groups: readonly (readonly [readonly string[], T])[]
): ResolverFn<T | undefined> => {
    return (labels: string[]) => groups.find(([group]) => group.some(label => labels.includes(label)))?.[1];
};
