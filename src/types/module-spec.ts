import type {ConfigFromSchema, ConfigSchema} from './schema.ts';

export type DeepReadonly<T> = T extends readonly unknown[]
    ? {readonly [K in keyof T]: DeepReadonly<T[K]>}
    : T extends object ? {readonly [K in keyof T]: DeepReadonly<T[K]>} : T;

/** Additional annotations only: neither outputs nor callbacks participate in matching. */
export interface InferredLabelRule<TConfig> {
    readonly produces: readonly string[];
    readonly infer: (config: DeepReadonly<Required<TConfig>>) => readonly string[];
}

/** Prefer invariant/schema capabilities; inference is a fallback without matching support. */
export interface ModuleSpec<TSchema extends ConfigSchema = ConfigSchema> {
    readonly generalLabels: readonly string[];
    readonly inferredLabels?: readonly InferredLabelRule<ConfigFromSchema<TSchema>>[];
}

/**
 * Heterogeneous catalog/runtime boundary. Authored specs remain schema-typed; the
 * runtime validates the owning schema and complete configuration before invocation.
 */
export interface AnyModuleSpec {
    readonly generalLabels: readonly string[];
    readonly inferredLabels?: readonly {
        readonly produces: readonly string[];
        readonly infer: (config: any) => readonly string[];
    }[];
}
