import { ViewTypeMap } from './problems.ts';

/**
 * Represents the fundamental, abstract mathematical or conceptual problem.
 * This is completely independent of how it will be visually represented.
 */
export interface AbstractProblem<TData = any> {
    /** A unique identifier representing the underlying problem (e.g., '15-subtract-7') */
    id: string;
    /** The type of problem to route it to compatible renderers */
    type: 'arithmetic' | 'counting' | 'measurement' | 'time' | 'ordering' | 'comparison' | 'writing' | 'geometry';
    /** The core mathematical data. e.g. { num1: 15, num2: 7, operator: 'subtract', answer: 8 } */
    data: TData;
    /** Pedagogical tags for dataset balancing (e.g., ['has_zero', 'requires_carry', 'negative_result']) */
    tags?: string[];
}

/**
 * Defines the configuration needed by a specific visual renderer.
 * These are the parameters that dictate HOW the problem is shown, not WHAT the problem is.
 */
export interface RenderConfig {
    /** The ID of the visual module to use (e.g., 'operations-boxes', 'operations-vertical') */
    viewId: string;
    /** Visual-specific settings. 
     * e.g. for operations-boxes: { blankPart: 'answer' }
     * e.g. for operations-vertical: { showGridLines: true }
     */
    visualParams: Record<string, any>;
}

/**
 * The final payload sent from the Node orchestrator to the browser DOM.
 */
export interface RenderPayload<TProblem extends AbstractProblem = AbstractProblem> {
    problem: TProblem;
    config: RenderConfig;
    /** Whether this render should be styled as the 'stimulus' (Question) or the 'solution' (Answer) */
    isSolutionView: boolean;
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
 * A partial problem returned by generators, containing only the identity and raw data.
 * type and tags are filled in by the orchestrator.
 */
export type ProblemStub<TData = any> = Pick<AbstractProblem<TData>, 'id' | 'data'>;

/**
 * The dual input for problem generation: 
 * - labels: High-level pedagogical constraints from the ontology.
 * - constraints: Low-level technical or visual constraints.
 */
export interface GeneratorInput {
    labels: string[];
    constraints: Record<string, any>;
}

/**
 * The configuration used by the Abstract Generators to produce datasets.
 */
export interface DatasetGenerationConfig {
    /** 
     * An array of predefined configurations.
     */
    permutations: GeneratorInput[];
    /** The global random seed to use for this generation run */
    seed: number;
    /** How many unique mathematical problems to generate PER permutation. Default is 1. */
    countPerPermutation?: number;
}

/**
 * The contract for a Problem Generator (living in `src/generators/`).
 */
export interface ProblemGenerator<TData = any> {
    /** The type of problems this generates */
    type: AbstractProblem['type'];
    /** Visual modules capable of rendering problems from this generator */
    compatibleRenderers: string[];
    /** 
     * Generates a single unique abstract problem based on the labels and constraints.
     * Returns null if a valid problem could not be generated (triggers a retry).
     */
    generate(input: GeneratorInput): ProblemStub<TData> | null;
}


// --- ML Orchestrator Interfaces ---

/**
 * A blueprint defining a specific visual variation to apply to an abstract problem.
 */
export interface VisualBlueprint {
    viewId: string;
    visualParams: Record<string, any>;
    /** How many instances of THIS specific variation to generate per problem */
    instancesPerProblem: number; 
}

/**
 * Configuration for the ML Orchestrator to build the final dataset.
 */
export interface MLDatasetPipelineConfig {
    /** The filename or registry ID of the generator (e.g., 'arithmetic') */
    generatorName: string;
    generationConfig: DatasetGenerationConfig;
    
    /** 
     * Ratios for splitting the abstract problems. Must sum to 1.0.
     * e.g., { train: 0.8, val: 0.2 }
     */
    splits: {
        train: number;
        val: number;
    };

    /**
     * The array of visual variations applied to EVERY abstract problem.
     * By applying this blueprint uniformly, we guarantee the exact same 
     * visual diversity ratio in the Train, Val, and Test splits.
     */
    visualDistribution: VisualBlueprint[];
}
