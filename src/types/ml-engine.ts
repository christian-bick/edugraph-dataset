import { ViewTypeMap } from './problems.ts';

/**
 * Represents the fundamental, abstract mathematical or conceptual problem.
 * This is completely independent of how it will be visually represented.
 */
export interface AbstractProblem<TData = any> {
    /** The type of problem to route it to compatible renderers */
    type: 'arithmetic' | 'counting' | 'measurement' | 'time' | 'ordering' | 'comparison' | 'writing' | 'shape';
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

/**
 * A missing ontology concept task defined in a spec module.
 */
export interface OntologyTodo {
    standardId: string;
    title: string;
    description: string;
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
