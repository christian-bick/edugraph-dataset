export interface RangeConstraint {
    type: 'range';
    min: number;
    max: number;
}

export interface OptionsConstraint {
    type: 'options';
    values: any[];
}

export type ViewConstraint = RangeConstraint | OptionsConstraint;

export interface ViewSpec {
    viewId: string;
    /** Ontological labels supported/rendered by this view */
    supportedLabels?: string[];
    /** Parameter constraints used for both runtime validation and test value derivation */
    constraints: Record<string, ViewConstraint>;
    /** Configuration for the visual boundary test permutations.
     * - Keys mapping to an Array (or function returning an Array) are varied and cross-multiplied.
     * - Keys mapping to a non-Array value (or function (params) => non-Array) are evaluated statically or dynamically per permutation.
     */
    testParams: Record<string, any | ((constraintOrParams: any) => any)>;
}

// Built-in test helpers to keep specs clean and DRY
export function limitsAndMean(constraint: RangeConstraint): number[] {
    const { min, max } = constraint;
    const mid = Math.round((min + max) / 2);
    return [min, mid, max];
}

export function allOptions(constraint: OptionsConstraint): any[] {
    return constraint.values;
}
