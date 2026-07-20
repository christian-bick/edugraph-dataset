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
        
        // Find matching labels (either exact match or generic ancestor in competency labels)
        let matchingSupportedLabels = supportedLabels.filter(s => 
            competencyLabels.some(l => isSubConceptOf(s, l) || isSubConceptOf(l, s))
        );

        let resolverLabels: string[];
        if (matchingSupportedLabels.length === 0) {
            // Fallback logic: pick one randomly from all supported labels
            matchingSupportedLabels = [supportedLabels[Math.floor(random() * supportedLabels.length)]];
            resolverLabels = competencyLabels;
        } else {
            // Record consumed labels based on what was actually matched
            const matchingCompetencyLabels = competencyLabels.filter(l =>
                matchingSupportedLabels.some(s => isSubConceptOf(s, l) || isSubConceptOf(l, s))
            );
            resolverLabels = matchingCompetencyLabels;
            for (const l of matchingCompetencyLabels) {
                consumedLabels.add(l);
            }
        }

        if (isTuple) {
            const resolver = schemaValue[1] as (labels: string[], supported?: readonly string[]) => any;
            config[key] = resolver(resolverLabels, supportedLabels);
        } else {
            // For simple arrays, we must assign a single literal label, so we pick one randomly from the matches.
            const pickedLabel = matchingSupportedLabels[Math.floor(random() * matchingSupportedLabels.length)];
            config[key] = pickedLabel;
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
    const { config } = extractConfig(generator.schema, labels);
    return generator.generate(config);
}

