import type { ViewTypeMap } from './problems.ts';

/**
 * Represents the fundamental, abstract mathematical or conceptual problem.
 * This is completely independent of how it will be visually represented.
 */
export interface AbstractProblem<TData = any> {
    /** The type of problem to route it to compatible renderers */
    type: 'arithmetic' | 'counting' | 'measurement' | 'statistics' | 'time' | 'ordering' | 'comparison' | 'writing' | 'shape' | 'fraction';
    /** The core mathematical data. e.g. { num1: 15, num2: 7, operator: 'subtract', answer: 8 } */
    data: TData;
    /** Pedagogical tags for dataset balancing (e.g., ['has_zero', 'requires_carry', 'negative_result']) */
    tags?: string[];
}

/**
 * The final payload sent from the Node orchestrator to the browser DOM.
 */
export interface RenderPayload<TProblem extends AbstractProblem = AbstractProblem> {
    problem: TProblem;
    viewId: string;
    labels: string[];
    /** Whether this render should be styled as the 'stimulus' (Question) or the 'solution' (Answer) */
    isSolutionView: boolean;
    /** Deterministic render seed derived from the sample identity; views must draw all entropy from it */
    seed: number;
}

/**
 * Helper utility to get a type-safe RenderPayload for a specific view ID defined in ViewTypeMap.
 */
export type ViewRenderPayload<TViewId extends keyof ViewTypeMap> = RenderPayload<AbstractProblem<ViewTypeMap[TViewId]>>;

/**
 * The contract that every visual module in `src/exercises/` must adhere to.
 * Instead of auto-executing on load, they attach this to the global window object.
 */
export interface ExerciseRenderer {
    /**
     * @param payload The data and configuration to render
     * @param container The DOM element where the exercise should be injected
     */
    render(payload: RenderPayload<any>, container: HTMLElement): void;
}

/**
 * Extending the global Window interface to include our ML engine hook.
 */
declare global {
    interface Window {
        renderView?: (payload: RenderPayload<any>) => void;
    }
}

// --- Generator Interfaces ---

/**
 * A partial problem returned by generators, containing only the raw data.
 * type is filled in by the orchestrator; identity is entirely structural
 * (target.id, generatorId, viewId, mode, instance — see src/lib/generation.ts),
 * so generators do not author an id of their own.
 */
export interface ProblemStub<TData = any> {
    data: TData;
    /** Pedagogical tags for dataset balancing (e.g., ['has_zero', 'requires_carry', 'negative_result']) */
    tags?: string[];
}



/**
 * The contract for a Problem Generator (living in `src/generators/`).
 */
export interface ProblemGenerator<TData = any, TConfig = any> {
    /** The type of problems this generates */
    type: AbstractProblem['type'];
    /** The configuration schema exposed to the dataset orchestrator */
    schema: any;
    /** 
     * Generates a single unique abstract problem based on the provided configuration.
     * Returns null if a valid problem could not be generated (triggers a retry).
     */
    generate(config: TConfig): ProblemStub<TData> | null;
}

/**
 * A single label permutation produced by the DatasetPermutationBuilder.
 */
export interface GeneratorInput {
    /** Pedagogical ontology labels (Area/Scope/Ability IRIs) */
    labels: string[];
}

/**
 * A competency target defined in a spec module (e.g. src/spec/ccss/), matched
 * against generator and view capabilities by the dataset pipeline.
 */
export interface CompetencyTarget {
    id: string;
    labels: string[];
    explanation?: string;
}

export type ImplementationStrategy = 'reuse' | 'expand' | 'new';

/** One generator or view module's reviewed role in an implementation package. */
export interface ModuleImplementation {
    module: string;
    strategy: ImplementationStrategy;
}

/**
 * A reviewed implementation package. Target TODOs reference this definition so
 * module ownership and reuse/expansion/creation decisions are authored once.
 */
export interface Implementation {
    id: string;
    description: string;
    generators: readonly ModuleImplementation[];
    views: readonly ModuleImplementation[];
}

/**
 * An addressable competency whose ontology labels are known but whose current
 * generator/view catalog cannot realize it.
 */
export interface ImplementationTodo extends CompetencyTarget {
    implementation: Implementation;
}

export type OntologyDimension = 'Area' | 'Scope' | 'Ability';

/** One ontology dimension's reviewed contribution to an ontology package. */
export interface OntologyChange {
    dimension: OntologyDimension;
    entities: readonly string[];
}

/**
 * A reviewed ontology package. Leaf-indexed TODOs reference this definition so
 * one coherent ontology change can serve multiple standards or competencies.
 */
export interface OntologyPackage {
    id: string;
    description: string;
    changes: readonly OntologyChange[];
}

/**
 * A leaf-indexed missing ontology competency that references one reviewed
 * ontology package.
 */
export interface OntologyTodo {
    standardId: string;
    title: string;
    description: string;
    ontology: OntologyPackage;
}

/**
 * A competency that cannot be evidenced by the dataset's declared medium.
 * Unlike a todo, this is an intentional project boundary and creates no
 * implementation or ontology backlog item.
 */
export interface BeyondScopeEntry {
    standardId: string;
    title: string;
    description: string;
}

/**
 * A deliberate declaration that two or more target definitions (their
 * `toTargets` id prefixes, e.g. 'K.CC.A.3-write-numerals') describe the same
 * competency and are therefore expected to produce identical permutation sets.
 *
 * Some CCSS standards restate a competency across grades whose grade-level
 * distinction the pipeline cannot yet express (e.g. K vs grade-1 numeral
 * writing, which only differ above the supported number range). Declaring the
 * equivalence keeps every standard id visible in the coverage visualization
 * (map-standards reads the raw targets) while telling the validator the
 * identity is intentional, not a modelling mistake. It is never read by the
 * generation pipeline: identical permutations already collapse to one
 * representative via `deduplicateTargetPermutations`, so there is no
 * downstream special-casing.
 */
export interface TargetEquivalence {
    /** Definition prefixes that are intentionally indistinguishable. */
    targets: string[];
    /** Why the identity is deliberate (documented for reviewers and reports). */
    reason: string;
}

/**
 * Configuration for the ML Orchestrator to build the final dataset.
 */
export interface MLDatasetPipelineConfig {
    /** The filename or registry ID of the generator (e.g., 'arithmetic') */
    generatorName: string;

    /** 
     * Ratios for splitting the abstract problems. Must sum to 1.0.
     * e.g., { train: 0.8, val: 0.2 }
     */
    splits: {
        train: number;
        val: number;
    };

}
