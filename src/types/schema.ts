export type LabelResolution = 'exact' | 'predicate' | 'aggregate' | 'compositional';

export type ResolverFn<T> = ((labels: string[], supportedLabels?: readonly string[]) => T) & {
  readonly labelResolution?: LabelResolution;
};

const markLabelResolution = <T, TResolution extends LabelResolution>(
  resolver: ResolverFn<T>,
  labelResolution: TResolution
): ResolverFn<T> & {readonly labelResolution: TResolution} =>
  Object.assign(resolver, {labelResolution});

/** Marks a custom resolver that rejects all undeclared alternative combinations. */
export const exactResolver = <T>(resolver: ResolverFn<T>): ResolverFn<T> =>
  markLabelResolution(resolver, 'exact');

/** Marks a resolver that answers one fixed boolean label predicate. */
export const predicateResolver = <T>(resolver: ResolverFn<T>): ResolverFn<T> =>
  markLabelResolution(resolver, 'predicate');

/** Marks a resolver that returns every matching member rather than selecting one. */
export const aggregateResolver = <T>(resolver: ResolverFn<T>): ResolverFn<T> =>
  markLabelResolution(resolver, 'aggregate');

/**
 * Marks a resolver whose result deliberately combines several independent label constraints.
 * Unlike an exact choice, a compositional resolver may accept multiple supported labels at once.
 */
export const compositionalResolver = <T>(resolver: ResolverFn<T>): ResolverFn<T> =>
  markLabelResolution(resolver, 'compositional');

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
