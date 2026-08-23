export interface GraphExecutionMode<T> {
    /** Rebuild every current node and bypass incremental construction shortcuts. */
    reconstruct: boolean;
    /** Compare the reconstructed graph with this baseline. Null means a full reset. */
    comparison: T | null;
    /** State eligible for partial graph construction and observation shortcuts. */
    incremental: T | null;
    externalIdentityChanged: boolean;
    baselineReset: boolean;
}

/**
 * Separates authoritative reconstruction from deliberate baseline reset.
 * External provenance changes use reconstruction, retaining the prior graph for
 * record-level comparison; only reset discards that comparison baseline.
 */
export function resolveGraphExecutionMode<T>(options: {
    previous: T | null;
    previousSupported?: boolean;
    previousExternalIdentity?: string;
    rebuild: boolean;
    reset?: boolean;
    currentExternalIdentity: string;
}): GraphExecutionMode<T> {
    const reset = options.reset ?? false;
    if (options.rebuild && reset) {
        throw new Error('--rebuild-graph and --reset-graph are mutually exclusive.');
    }
    const externalIdentityChanged = Boolean(options.previous
        && options.previousExternalIdentity !== options.currentExternalIdentity);
    const baselineReset = reset || Boolean(options.previous && options.previousSupported === false);
    const reconstruct = options.rebuild || externalIdentityChanged || baselineReset;
    return {
        reconstruct,
        comparison: baselineReset ? null : options.previous,
        incremental: reconstruct ? null : options.previous,
        externalIdentityChanged,
        baselineReset
    };
}
