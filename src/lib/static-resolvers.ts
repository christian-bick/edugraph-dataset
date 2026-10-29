import type {ResolverFn} from '../types/schema.ts';

const deterministicResolvers = new WeakSet<Function>();

/**
 * Explicitly reviewed deterministic functions only: shared factories or an owner resolver
 * with a documented singleton proof for every admitted binding and declared context.
 * Registration certifies the exact function identity; copied metadata never certifies a wrapper.
 */
export function registerStaticResolver<T>(resolver: ResolverFn<T>): ResolverFn<T> {
    deterministicResolvers.add(resolver);
    return resolver;
}

/** A complete admitted binding has exactly one configuration value for these resolvers. */
export const hasStaticResolution = (resolver: unknown): boolean =>
    typeof resolver === 'function' && deterministicResolvers.has(resolver);
