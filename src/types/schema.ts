export type ResolverFn<T> = (labels: string[]) => T;

export type SchemaValue<T = any> =
  | readonly string[]
  | ResolverFn<T>
  | readonly [readonly string[], ResolverFn<T>];

export type ConfigSchema = Record<string, SchemaValue>;

export type ConfigFromSchema<T extends ConfigSchema> = {
  [K in keyof T]?: T[K] extends readonly string[]
    ? T[K][number]
    : T[K] extends ResolverFn<infer R1>
    ? R1
    : T[K] extends readonly [readonly string[], ResolverFn<infer R2>]
    ? R2
    : never;
};
