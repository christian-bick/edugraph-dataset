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
    generalLabels: readonly string[];
    /** Parameter constraints used for both runtime validation and test value derivation */
    constraints?: Record<string, ViewConstraint>;
}
