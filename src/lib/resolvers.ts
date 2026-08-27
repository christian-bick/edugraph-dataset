import {
    aggregateResolver,
    exactResolver,
    OntologyNeutralResolverFn,
    predicateResolver,
    ResolverFn
} from '../types/schema.ts';
import { capabilitySatisfies } from './ontology.ts';

/**
 * Marks a function-only schema choice as independent of ontology labels.
 * Use this only for deterministic seeded configuration that contributes no capability label.
 */
export const ontologyNeutral = <T>(resolver: () => T): OntologyNeutralResolverFn<T> =>
    Object.assign(resolver, {ontologyNeutral: true as const});

export const hasLabel = (targetLabel: string): ResolverFn<boolean> => {
    return predicateResolver((labels: string[]) => labels.includes(targetLabel));
};

export const hasCapability = (targetLabel: string): ResolverFn<boolean> => {
    return predicateResolver((labels: string[]) =>
        labels.some(label => capabilitySatisfies(label, targetLabel)));
};

export const matchAllCapabilities = (targetLabels: readonly string[]): ResolverFn<string[]> => {
    return aggregateResolver((labels: string[]) => targetLabels.filter(target =>
        labels.some(label => capabilitySatisfies(label, target))));
};

export const selectExactMatch = exactResolver((labels: string[], supportedLabels?: readonly string[]): string | undefined => {
    const matches = supportedLabels?.filter(label => labels.includes(label)) ?? [];
    if (matches.length > 1) {
        throw new Error(`Ambiguous exact label selection: ${matches.join(' + ')}`);
    }
    return matches[0];
});

export const matchAllExactLabels = aggregateResolver((labels: string[], supportedLabels?: readonly string[]): string[] => {
    if (!supportedLabels) return [];
    return supportedLabels.filter(s => labels.includes(s));
});

export const selectExactLabelMap = <
    const TMappings extends readonly (readonly [string, unknown])[]
>(
    mappings: TMappings
): ResolverFn<TMappings[number][1] | undefined> => {
    const mappedLabels = mappings.map(([label]) => label);
    if (new Set(mappedLabels).size !== mappedLabels.length) {
        throw new Error('Exact label mappings must not declare a label more than once.');
    }

    return exactResolver((labels: string[]) => {
        const matches = mappings.filter(([label]) => labels.includes(label));
        if (matches.length > 1) {
            throw new Error(`Ambiguous exact label mapping: ${matches.map(([label]) => label).join(' + ')}`);
        }
        return matches[0]?.[1];
    });
};

export const selectExactLabelSetMap = <
    const TMappings extends readonly (readonly [readonly string[], unknown])[]
>(
    mappings: TMappings
): ResolverFn<TMappings[number][1] | undefined> => {
    const mappedLabels = [...new Set(mappings.flatMap(([labels]) => labels))];
    const exactLabelSetKey = (labels: readonly string[]): string => {
        const labelSet = new Set(labels);
        return JSON.stringify(mappedLabels.filter(label => labelSet.has(label)));
    };
    const mappingKeys = mappings.map(([labels]) => exactLabelSetKey(labels));
    if (new Set(mappingKeys).size !== mappingKeys.length) {
        throw new Error('Exact label-set mappings must not declare the same label set more than once.');
    }
    const mappingByKey = new Map(mappingKeys.map((key, index) => [key, mappings[index][1]]));
    const candidateSets = mappings.map(([labels]) => new Set(labels));

    return exactResolver((labels: string[]) => {
        const inputLabels = new Set(labels);
        const presentLabels = mappedLabels.filter(label => inputLabels.has(label));
        const presentKey = exactLabelSetKey(presentLabels);
        if (mappingByKey.has(presentKey)) return mappingByKey.get(presentKey);

        const isIncomplete = candidateSets.some(candidate =>
            presentLabels.every(label => candidate.has(label)));
        if (isIncomplete) return undefined;

        throw new Error(`Unsupported exact label combination: ${presentLabels.join(' + ')}`);
    });
};
