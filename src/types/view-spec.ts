import type {ViewCompatibilityRule} from './compatibility.ts';

export interface ViewSpec {
    viewId: string;
    /** Ontological labels supported/rendered by this view */
    generalLabels: readonly string[];
    /** Pure semantic constraints; generator parameter names and payloads are unavailable. */
    compatibility?: readonly ViewCompatibilityRule[];
    /** Target labels that must be requested explicitly for this view to participate */
    requiredLabels?: readonly string[];
    /** Semantic boundaries this view enforces (e.g. visual capacity labels like Scope.NumbersSmaller20) */
    rejectedLabels?: readonly string[];
}
