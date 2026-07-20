import { ResolverFn } from '../types/schema.ts';
import { isSubConceptOf } from './ontology.ts';

export const hasLabel = (targetLabel: string): ResolverFn<boolean> => {
    return (labels: string[]) => labels.includes(targetLabel);
};

export const hasSubConcept = (targetLabel: string): ResolverFn<boolean> => {
    return (labels: string[]) => labels.some(l => isSubConceptOf(l, targetLabel));
};

export const matchAllLabels = (targetLabels: readonly string[]): ResolverFn<string[]> => {
    return (labels: string[]) => targetLabels.filter(t => labels.some(l => isSubConceptOf(l, t)));
};

export const selectExactMatch = (labels: string[], supportedLabels?: readonly string[]): string | undefined => {
    return supportedLabels?.find(s => labels.includes(s));
};

export const matchAllExactLabels = (labels: string[], supportedLabels?: readonly string[]): string[] => {
    if (!supportedLabels) return [];
    return supportedLabels.filter(s => labels.some(l => isSubConceptOf(l, s)));
};

