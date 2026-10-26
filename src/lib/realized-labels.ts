import {Scope} from 'edugraph-ts/generated';
import type {RealizedLabelReceipt} from '../types/generation-plan.ts';
import {digestIdentity} from './content-identity.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import {assessLabelDependencyEvidence, hasLabelDependencyEvidenceAdapter,
    LABEL_DEPENDENCY_EVIDENCE_VERSION} from './label-dependency-evidence.ts';

const arithmeticGenerators = new Set(['arithmetic-ops-pairs', 'arithmetic-ops-triples', 'arithmetic-ops-four']);
const evaluator = createLabelDependencyEvaluator();
const ordered = (labels: readonly string[]) => [...new Set(labels)].sort();

/** Explicit machinery inputs because ordinary generator/view imports do not reach this policy. */
export const REALIZED_LABEL_SOURCE_PATHS = [
    'src/lib/realized-labels.ts', 'src/lib/label-dependency-evidence.ts', 'src/lib/label-dependencies.ts',
    'src/validation/label-dependencies.ts', 'src/types/label-dependencies.ts',
    'src/types/generation-plan.ts', 'src/lib/planned-generation.ts',
    'src/lib/generation-orchestration.ts', 'src/lib/generation.ts', 'src/scripts/generate-dataset.ts'
] as const;

export const REALIZED_LABEL_ONTOLOGY_LABELS = [
    Scope.OperandDigitCount, Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand,
    Scope.ThreeDigitSmallestOperand, Scope.MultipleDigitSmallestOperand,
    Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand, Scope.ThreeDigitLargestOperand,
    Scope.FourDigitLargestOperand, Scope.MultipleDigitLargestOperand,
    Scope.SingleDigitDividend, Scope.TwoDigitDividend, Scope.ThreeDigitDividend,
    Scope.FourDigitDividend, Scope.MultipleDigitDividend,
    Scope.SingleDigitDivisor, Scope.TwoDigitDivisor, Scope.ThreeDigitDivisor, Scope.MultipleDigitDivisor
] as const;

const policyHash = digestIdentity({version: 1, dependencyPolicy: evaluator.policyHash,
    evidenceVersion: LABEL_DEPENDENCY_EVIDENCE_VERSION, facets: ['operandDigits']});

export function realizedLabelPolicyForPair(generatorId: string, viewId: string): string | null {
    return arithmeticGenerators.has(generatorId) && hasLabelDependencyEvidenceAdapter(generatorId, viewId)
        ? policyHash : null;
}

/** Adds only supported observable operand facts; planned claims, data, config and entropy survive intact. */
export function completeRealizedLabels(input: {
    generatorId: string;
    viewId: string;
    mode: 'question' | 'solution';
    data: unknown;
    plannedLabels: readonly string[];
}): {labels: string[]; receipt?: RealizedLabelReceipt} {
    const plannedLabels = ordered(input.plannedLabels);
    const policy = realizedLabelPolicyForPair(input.generatorId, input.viewId);
    if (!policy || evaluator.evaluate(plannedLabels).context.status !== 'eligible') return {labels: plannedLabels};
    const evidence = assessLabelDependencyEvidence(input);
    const evaluation = evaluator.evaluate(plannedLabels, evidence);
    const assessment = evaluation.assessments.find(item => item.facet === 'operandDigits');
    const supported = assessment && (assessment.status === 'missing' || assessment.status === 'satisfied');
    const addedLabels = supported ? assessment.expectedLabels.filter(label => !plannedLabels.includes(label)) : [];
    const receipt: RealizedLabelReceipt = {version: 1, policyHash: policy, mode: input.mode,
        plannedLabels, addedLabels: ordered(addedLabels), evidence: supported
            ? [{facet: 'operandDigits', labels: assessment.expectedLabels, references: assessment.references}] : []};
    return {labels: ordered([...plannedLabels, ...addedLabels]), receipt};
}
