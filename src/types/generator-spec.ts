import type {GeneratorCompatibilityRule} from './compatibility.ts';

export interface GeneratorSpec {
    generatorId: string;
    /** Ontological labels supported/covered by this generator */
    generalLabels: readonly string[];
    /** Pure label constraints on this generator's configuration choices. */
    compatibility?: readonly GeneratorCompatibilityRule[];
}
