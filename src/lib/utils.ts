import { ConfigSchema, ConfigFromSchema, ResolvedConfig } from '../types/schema.ts';
import { isSubConceptOf } from './ontology.ts';
import { random } from './random.ts';
import { ProblemGenerator, ResolvedProblemStub } from '../types/ml-engine.ts';

export type SchemaResolutionContractIssue = {
    field: string;
    kind:
        | 'empty-supported-labels'
        | 'unmarked-function-only-resolver';
};

export type SchemaFallbackContractIssue = {
    field: string;
    label: string;
    reason: 'unresolved' | 'resolver-error' | 'undeclared-label';
};

const isResolverTuple = (schemaValue: unknown): schemaValue is readonly [
    readonly string[],
    (labels: string[], supported?: readonly string[]) => unknown,
    ...unknown[]
] => Array.isArray(schemaValue)
    && schemaValue.length >= 2
    && typeof schemaValue[1] === 'function';

const fallbackLabelSets = (schemaValue: readonly unknown[], supportedLabels: readonly string[]) =>
    schemaValue.length >= 3
        ? schemaValue[2] as readonly (readonly string[])[]
        : supportedLabels.map(label => [label] as const);

/**
 * Finds schema choices whose ontological meaning cannot be reconstructed.
 * Label-backed fields need at least one supported capability; function-only
 * fields must explicitly certify that they are ontology-neutral.
 */
export function findSchemaResolutionContractIssues(schema: ConfigSchema): SchemaResolutionContractIssue[] {
    const issues: SchemaResolutionContractIssue[] = [];
    for (const [field, schemaValue] of Object.entries(schema)) {
        if (typeof schemaValue === 'function') {
            if (schemaValue.ontologyNeutral !== true) {
                issues.push({field, kind: 'unmarked-function-only-resolver'});
            }
            continue;
        }

        const isTuple = isResolverTuple(schemaValue);
        const supportedLabels = isTuple ? schemaValue[0] : schemaValue;
        if (supportedLabels.length === 0) {
            issues.push({field, kind: 'empty-supported-labels'});
            continue;
        }
    }
    return issues;
}

/** Proves that every label which may be selected as a tuple fallback resolves to a value. */
export function findSchemaFallbackContractIssues(schema: ConfigSchema): SchemaFallbackContractIssue[] {
    const issues: SchemaFallbackContractIssue[] = [];
    for (const [field, schemaValue] of Object.entries(schema)) {
        const isTuple = isResolverTuple(schemaValue);
        if (!isTuple) continue;

        const supportedLabels = schemaValue[0] as readonly string[];
        const resolver = schemaValue[1];
        for (const labelSet of fallbackLabelSets(schemaValue, supportedLabels)) {
            const undeclared = labelSet.find(label => !supportedLabels.includes(label));
            if (undeclared) {
                issues.push({field, label: undeclared, reason: 'undeclared-label'});
                continue;
            }
            const label = labelSet.join(' + ');
            try {
                const value = resolver([...labelSet], supportedLabels);
                if (value === undefined || value === null) {
                    issues.push({field, label, reason: 'unresolved'});
                }
            } catch {
                issues.push({field, label, reason: 'resolver-error'});
            }
        }
    }
    return issues;
}

function assertSchemaResolutionContract(schema: ConfigSchema): void {
    const issue = findSchemaResolutionContractIssues(schema)[0];
    if (!issue) return;
    if (issue.kind === 'empty-supported-labels') {
        throw new Error(`Schema field "${issue.field}" has no supported capability labels.`);
    }
    throw new Error(
        `Schema field "${issue.field}" uses a function-only resolver that is not marked ontologyNeutral().`
    );
}


export function extractConfig<T extends ConfigSchema>(
    schema: T,
    competencyLabels: string[]
): ResolvedConfig<ConfigFromSchema<T>> {
    assertSchemaResolutionContract(schema);
    const config: any = {};
    const resolvedLabels = new Set<string>();

    for (const key in schema) {
        const schemaValue = schema[key];
        
        if (typeof schemaValue === 'function') {
            config[key] = schemaValue();
            continue;
        }

        const isTuple = isResolverTuple(schemaValue);
        const supportedLabels: string[] = isTuple ? (schemaValue[0] as string[]) : (schemaValue as string[]);

        if (isTuple) {
            const resolver = schemaValue[1];
            const matchingSupportedLabels = supportedLabels.filter(label =>
                competencyLabels.includes(label)
            );
            let resolved = resolver(competencyLabels, supportedLabels);
            
            const hasExplicitFallback = schemaValue.length >= 3;
            if (resolved === undefined || resolved === null
                || (hasExplicitFallback && matchingSupportedLabels.length === 0)) {
                const relevantLabels = competencyLabels.filter(label =>
                    supportedLabels.includes(label)
                );
                const compatibleCandidates = fallbackLabelSets(schemaValue, supportedLabels).filter(labelSet =>
                    relevantLabels.every(targetLabel => labelSet.some(label =>
                        isSubConceptOf(label, targetLabel) || isSubConceptOf(targetLabel, label)
                    ))
                );
                if (compatibleCandidates.length === 0) {
                    throw new Error(`Schema field "${key}" cannot complete the requested label combination.`);
                }
                const compatibilityScore = (labelSet: readonly string[]) => labelSet.reduce(
                    (score, label) => score + competencyLabels.filter(targetLabel =>
                        isSubConceptOf(label, targetLabel) || isSubConceptOf(targetLabel, label)
                    ).length,
                    0
                );
                const bestScore = Math.max(...compatibleCandidates.map(compatibilityScore));
                const candidates = compatibleCandidates.filter(labelSet =>
                    compatibilityScore(labelSet) === bestScore
                );
                const selectedLabels = candidates[Math.floor(random() * candidates.length)];
                resolved = resolver([...new Set([...competencyLabels, ...selectedLabels])], supportedLabels);
                if (resolved === undefined || resolved === null) {
                    throw new Error(`Schema field "${key}" fallback did not resolve a configuration value.`);
                }
                for (const label of selectedLabels) resolvedLabels.add(label);
            } else {
                for (const label of matchingSupportedLabels) resolvedLabels.add(label);
            }
            config[key] = resolved;
        } else {
            const matchingSupportedLabels = supportedLabels.filter(s => 
                competencyLabels.some(l => isSubConceptOf(s, l) || isSubConceptOf(l, s))
            );
            
            if (matchingSupportedLabels.length === 0) {
                const fallbackLabel = supportedLabels[Math.floor(random() * supportedLabels.length)];
                config[key] = fallbackLabel;
                resolvedLabels.add(fallbackLabel);
            } else {
                const pickedLabel = matchingSupportedLabels[Math.floor(random() * matchingSupportedLabels.length)];
                config[key] = pickedLabel;
                
                resolvedLabels.add(pickedLabel);
            }
        }
    }

    return { config, resolvedLabels: Array.from(resolvedLabels) };
}

export function extractSchemaLabels<T extends ConfigSchema>(schema?: T): string[] {
    if (!schema) return [];
    const labels = new Set<string>();
    
    for (const key in schema) {
        const schemaValue = schema[key];
        if (typeof schemaValue === 'function') {
            continue;
        }
        
        const isTuple = isResolverTuple(schemaValue);
        const supportedLabels: string[] = isTuple ? (schemaValue[0] as string[]) : (schemaValue as string[]);
        
        for (const label of supportedLabels) {
            labels.add(label);
        }
    }
    
    return Array.from(labels);
}

export function generateWithLabels<TData = any, TConfig = any>(
    generator: ProblemGenerator<TData, TConfig>,
    labels: string[]
): ResolvedProblemStub<TData> | null {
    if (!generator.schema) {
        throw new Error('Generator is missing a schema!');
    }
    const { config, resolvedLabels } = extractConfig(generator.schema, labels);
    const problem = generator.generate(config as TConfig);
    return problem ? {...problem, labels: Array.from(new Set(resolvedLabels))} : null;
}

export function shortenLabel(label: string): string {
    const prefix = 'http://edugraph.io/edu/';
    return label.startsWith(prefix) ? label.slice(prefix.length) : label;
}

export function formatLabelsKey(labels: string[]): string {
    return labels.map(shortenLabel).sort().join('|');
}

/**
 * Canonical, collision-free key for a label set: labels are deduplicated,
 * sorted and JSON-encoded. JSON encoding (rather than joining on a delimiter
 * character) guarantees that two different label sets can never map to the
 * same key, regardless of the characters a label contains.
 */
export function labelSetKey(labels: string[]): string {
    return JSON.stringify(Array.from(new Set(labels)).sort());
}

function fnv1aHex(str: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Stable 8-hex-char content hash of a label set (FNV-1a over `labelSetKey`).
 * Used by `toTargets` as the permutation suffix in target ids, so a
 * permutation's id — and with it its sample seeds and cached images —
 * depends only on its own label set, never on its position in the builder.
 */
export function labelSetHash(labels: string[]): string {
    return fnv1aHex(labelSetKey(labels));
}

