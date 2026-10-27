/** Annotation completeness is universal within the dependency graph's Area allowlist. */
export const labelDependencyCoverage = {
    version: 2,
    scope: 'all-eligible-annotations',
    reportOnlyFacets: ['range'],
    // Selected configuration can gain supported descriptive labels after its draw.
    // Contradictions and invalid contexts are still checked before generation.
    reportOnlyCompletenessKinds: ['selection']
} as const;
