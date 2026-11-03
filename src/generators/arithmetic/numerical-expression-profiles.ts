import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';

export type NumericalExpressionStructure = 'grouped' | 'ungrouped';
export type NumericalExpressionProjection = 'structure' | 'calculation';
export interface NumericalExpressionProfile {
    readonly structure: NumericalExpressionStructure;
    readonly range: CanonicalNumericRange;
}

type ProfileCell = readonly [NumericalExpressionStructure, number, number];
// These reviewed cells are independently proved against the complete original
// weighted source domain in numerical-expression-domain.test.ts. Catalog loading
// needs only declarations; it must not construct or inspect sampled expressions.
const cells: Record<NumericalExpressionProjection, readonly ProfileCell[]> = {
    structure: [
        ['grouped', 20, 0], ['grouped', 20, 5], ['grouped', 100, 0], ['grouped', 100, 5],
        ['ungrouped', 5, 0], ['ungrouped', 10, 0], ['ungrouped', 10, 5]
    ],
    calculation: [
        ['grouped', 20, 0], ['grouped', 100, 0], ['grouped', 100, 5],
        ['grouped', 120, 0], ['grouped', 120, 5], ['grouped', 1000, 0], ['grouped', 1000, 5],
        ['ungrouped', 10, 0], ['ungrouped', 20, 0], ['ungrouped', 100, 0],
        ['ungrouped', 120, 0], ['ungrouped', 1000, 0], ['ungrouped', 1000, 5], ['ungrouped', 1000, 10]
    ]
};

/** Mathematical configuration only; range feasibility is proven by the full source-domain tests. */
export function numericalExpressionProfiles(projection: NumericalExpressionProjection) {
    return cells[projection].map(([structure, upper, lower]) => ({
        profile: {structure, range: createCanonicalNumericRange(upper, lower)}
    }));
}
