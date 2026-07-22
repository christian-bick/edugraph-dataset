export interface ViewSpec {
    viewId: string;
    /** Ontological labels supported/rendered by this view */
    generalLabels: readonly string[];
    /** Semantic boundaries this view enforces (e.g. visual capacity labels like Scope.NumbersSmaller20) */
    rejectedLabels?: readonly string[];
}
