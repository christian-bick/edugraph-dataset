import type {ConfigFromSchema, ConfigSchema} from '../types/schema.ts';
import {withoutRandomness} from './random.ts';
import {resolveSchemaChoices, type SchemaChoiceSelection} from './schema-choices.ts';
import {hasStaticResolution} from './static-resolvers.ts';

export type StaticSchemaResolution<TSchema extends ConfigSchema> =
    | {status: 'resolved'; config: ConfigFromSchema<TSchema>; resolvedLabels: string[]}
    | {status: 'pending'; fields: string[]; reason: string};

/** Resolve one complete owner configuration only when every field has a reviewed singleton contract. */
export function resolveStaticSchemaChoices<TSchema extends ConfigSchema>(
    schema: TSchema, targetLabels: readonly string[], selection: SchemaChoiceSelection
): StaticSchemaResolution<TSchema> {
    const fields = Object.entries(schema).filter(([, value]) => {
        if (typeof value === 'function') return true;
        const tuple = Array.isArray(value[0]) && typeof value[1] === 'function';
        return tuple && !hasStaticResolution(value[1]);
    }).map(([field]) => field).sort();
    if (fields.length) return {status: 'pending', fields,
        reason: `Complete configuration outcomes are not statically established for: ${fields.join(', ')}.`};
    return {status: 'resolved', ...withoutRandomness(() => resolveSchemaChoices(schema, targetLabels, selection))};
}
