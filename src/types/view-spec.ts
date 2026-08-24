export interface ViewSpec {
    viewId: string;
    /** Ontological labels supported/rendered by this view */
    generalLabels: readonly string[];
    /** Target labels that must be requested explicitly for this view to participate */
    requiredLabels?: readonly string[];
    /** Semantic boundaries this view enforces (e.g. visual capacity labels like Scope.NumbersSmaller20) */
    rejectedLabels?: readonly string[];
}
