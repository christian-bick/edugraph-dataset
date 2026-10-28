/** Annotation completeness is universal within the dependency graph's Area allowlist. */
export const labelDependencyCoverage = {
    version: 2,
    scope: 'all-eligible-annotations',
    reportOnlyFacets: ['range'],
    // Static selection omissions are advisory; finalized samples enforce completeness.
    // Contradictions and invalid contexts are still checked before generation.
    reportOnlyCompletenessKinds: ['selection']
} as const;
