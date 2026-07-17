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

export const extractFirstMatch = <T extends string>(targetLabels: readonly T[], defaultValue?: T): ResolverFn<T | undefined> => {
    return (labels: string[]) => {
        const match = targetLabels.find(t => labels.some(l => isSubConceptOf(l, t)));
        return match ?? defaultValue;
    };
};
