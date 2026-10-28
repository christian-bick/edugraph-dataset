import type {ResolverFn} from '../types/schema.ts';

const deterministicResolvers = new WeakSet<Function>();

/** Reviewed shared factories only; copied metadata never certifies a custom wrapper. */
export function registerStaticResolver<T>(resolver: ResolverFn<T>): ResolverFn<T> {
    deterministicResolvers.add(resolver);
    return resolver;
}

/** A complete admitted binding has exactly one configuration value for these resolvers. */
export const hasStaticResolution = (resolver: unknown): boolean =>
    typeof resolver === 'function' && deterministicResolvers.has(resolver);
