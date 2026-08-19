export interface ViewSpec {
    viewId: string;
    /** Ontological labels supported/rendered by this view */
    generalLabels: readonly string[];
    /** Target labels required for this view's payload projection to apply */
    requiredLabels?: readonly string[];
    /** Semantic boundaries this view enforces (e.g. visual capacity labels like Scope.NumbersSmaller20) */
    rejectedLabels?: readonly string[];
}
