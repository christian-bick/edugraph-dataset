import { ConfigSchema, ConfigFromSchema } from '../types/schema.ts';
import { isSubConceptOf } from './ontology.ts';
import { random } from './random.ts';
import { ProblemGenerator, ProblemStub } from '../types/ml-engine.ts';


export function extractConfig<T extends ConfigSchema>(
    schema: T,
    competencyLabels: string[]
): { config: ConfigFromSchema<T>; consumedLabels: string[] } {
    const config: any = {};
    const consumedLabels = new Set<string>();

    for (const key in schema) {
        const schemaValue = schema[key];
        
        if (typeof schemaValue === 'function') {
            config[key] = schemaValue(competencyLabels);
            continue;
        }

        const isTuple = Array.isArray(schemaValue) && schemaValue.length === 2 && typeof schemaValue[1] === 'function';
        const supportedLabels: string[] = isTuple ? (schemaValue[0] as string[]) : (schemaValue as string[]);

        if (isTuple) {
            const resolver = schemaValue[1] as (labels: string[], supported?: readonly string[]) => any;
            let resolved = resolver(competencyLabels, supportedLabels);
            
            if (resolved === undefined) {
                const fallbackLabel = supportedLabels[Math.floor(random() * supportedLabels.length)];
                resolved = resolver([fallbackLabel], supportedLabels);
                consumedLabels.add(fallbackLabel);
            } else {
                const matchingCompetencyLabels = competencyLabels.filter(l =>
                    supportedLabels.some(s => isSubConceptOf(s, l) || isSubConceptOf(l, s))
                );
                for (const l of matchingCompetencyLabels) {
                    consumedLabels.add(l);
                }
            }
            config[key] = resolved;
        } else {
            const matchingSupportedLabels = supportedLabels.filter(s => 
                competencyLabels.some(l => isSubConceptOf(s, l) || isSubConceptOf(l, s))
            );
            
            if (matchingSupportedLabels.length === 0) {
                const fallbackLabel = supportedLabels[Math.floor(random() * supportedLabels.length)];
                config[key] = fallbackLabel;
                consumedLabels.add(fallbackLabel);
            } else {
                const pickedLabel = matchingSupportedLabels[Math.floor(random() * matchingSupportedLabels.length)];
                config[key] = pickedLabel;
                
                const matchingCompetencyLabels = competencyLabels.filter(l =>
                    isSubConceptOf(pickedLabel, l) || isSubConceptOf(l, pickedLabel)
                );
                for (const l of matchingCompetencyLabels) {
                    consumedLabels.add(l);
                }
            }
        }
    }

    return { config, consumedLabels: Array.from(consumedLabels) };
}

export function extractSchemaLabels<T extends ConfigSchema>(schema?: T): string[] {
    if (!schema) return [];
    const labels = new Set<string>();
    
    for (const key in schema) {
        const schemaValue = schema[key];
        if (typeof schemaValue === 'function') {
            continue;
        }
        
        const isTuple = Array.isArray(schemaValue) && schemaValue.length === 2 && typeof schemaValue[1] === 'function';
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
): ProblemStub<TData> | null {
    if (!generator.schema) {
        throw new Error('Generator is missing a schema!');
    }
    const { config, consumedLabels } = extractConfig(generator.schema, labels);
    const problem = generator.generate(config as TConfig);
    if (problem) {
        problem.tags = Array.from(new Set([...(problem.tags || []), ...consumedLabels]));
    }
    return problem;
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

