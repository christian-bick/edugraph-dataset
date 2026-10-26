import type {GenerationSelectionReceipt} from './compatibility.ts';

/** Instance facts appended after configuration resolution; never used to select a plan. */
export interface RealizedLabelReceipt {
    readonly version: 1;
    readonly policyHash: string;
    readonly mode: 'question' | 'solution';
    readonly plannedLabels: readonly string[];
    readonly addedLabels: readonly string[];
    readonly evidence: readonly {readonly facet: 'operandDigits' | 'operandCount' | 'zero'; readonly labels: readonly string[];
        readonly references: readonly string[]}[];
}

/** The exact plan-constrained draw used by an artifact, including solution reuse. */
export interface GenerationReplay {
    readonly version: 1;
    readonly sampleKey: string;
    readonly attempt: number;
    readonly seed: number;
    readonly selection: GenerationSelectionReceipt;
}

/** Prepared by orchestration; browsers restore presentation entropy without resolving choices again. */
export interface PreparedViewConfiguration {
    readonly version: 1;
    readonly viewId: string;
    readonly planHash: string;
    readonly variantHash: string;
    readonly config: Record<string, unknown>;
    readonly labels: readonly string[];
    readonly randomState: number;
}
