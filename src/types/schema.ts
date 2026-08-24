export type ResolverFn<T> = (labels: string[], supportedLabels?: readonly string[]) => T;

/**
 * A function-only schema choice that is explicitly independent of ontology labels.
 * It may use the seeded PRNG, and its resolved value remains part of task identity.
 */
export type OntologyNeutralResolverFn<T> = (() => T) & {
  readonly ontologyNeutral: true;
};

export type SchemaValue<T = any> =
  | readonly string[]
  | OntologyNeutralResolverFn<T>
  | readonly [readonly string[], ResolverFn<T>]
  | readonly [
      readonly string[],
      ResolverFn<T>,
      readonly (readonly string[])[]
    ];

export type ConfigSchema = Record<string, SchemaValue>;

export type ConfigFromSchema<T extends ConfigSchema> = {
  [K in keyof T]?: T[K] extends readonly string[]
    ? T[K][number]
    : T[K] extends OntologyNeutralResolverFn<infer R0>
    ? R0
    : T[K] extends ResolverFn<infer R1>
    ? R1
    : T[K] extends readonly [readonly string[], ResolverFn<infer R2>, ...readonly unknown[]]
    ? R2
    : never;
};

/** One deterministic schema resolution and the ontology capabilities selected by it. */
export interface ResolvedConfig<TConfig> {
  config: TConfig;
  resolvedLabels: string[];
}
