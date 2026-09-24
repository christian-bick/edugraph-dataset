import type {ViewCompatibilityRule} from './compatibility.ts';

export interface ViewSpec {
    viewId: string;
    /** Ontological labels supported/rendered by this view */
    generalLabels: readonly string[];
    /** Pure semantic constraints; generator parameter names and payloads are unavailable. */
    compatibility?: readonly ViewCompatibilityRule[];
}
