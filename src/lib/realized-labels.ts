import {Scope} from 'edugraph-ts/generated';
import type {RealizedLabelReceipt} from '../types/generation-plan.ts';
import {digestIdentity} from './content-identity.ts';
import {capabilitySatisfies} from './ontology.ts';
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
    'src/lib/label-dependency-coverage.ts', 'src/validation/label-dependency-coverage.ts',
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
    Scope.SingleDigitDivisor, Scope.TwoDigitDivisor, Scope.ThreeDigitDivisor, Scope.MultipleDigitDivisor,
    Scope.NumericZero, Scope.NumbersWithoutZero, Scope.NumbersWithZero,
    Scope.OperandCardinality, Scope.TwoOperands, Scope.ThreeOperands, Scope.FourOperands
] as const;

const policyHash = digestIdentity({version: 3, dependencyPolicy: evaluator.policyHash,
    evidenceVersion: LABEL_DEPENDENCY_EVIDENCE_VERSION, facets: ['operandDigits', 'operandCount', 'zero'],
    zeroCompletion: {generators: ['arithmetic-ops-pairs', 'reviewed-property-triples'],
        label: Scope.NumbersWithoutZero, mode: 'add-only'}});

const parityPolicyHash = digestIdentity({version: 1, dependencyPolicy: evaluator.policyHash,
    evidenceVersion: LABEL_DEPENDENCY_EVIDENCE_VERSION, projection: 'counting-objects-parity',
    correction: {from: Scope.NumbersWithoutZero, to: Scope.NumbersWithZero, preserveExplicitTargets: true}});

const parityPair = (generatorId: string, viewId: string) =>
    generatorId === 'counting-basic' && viewId === 'counting-objects-parity';

export function realizedLabelPolicyForPair(generatorId: string, viewId: string): string | null {
    if (parityPair(generatorId, viewId)) return parityPolicyHash;
    return arithmeticGenerators.has(generatorId) && hasLabelDependencyEvidenceAdapter(generatorId, viewId)
        ? policyHash : null;
}

/** Completes reviewed facts; parity alone may correct an inherited, non-target zero-absence claim. */
export function completeRealizedLabels(input: {
    generatorId: string;
    viewId: string;
    mode: 'question' | 'solution';
    data: unknown;
    plannedLabels: readonly string[];
    targetLabels?: readonly string[];
}): {labels: string[]; receipt?: RealizedLabelReceipt} {
    const plannedLabels = ordered(input.plannedLabels);
    const policy = realizedLabelPolicyForPair(input.generatorId, input.viewId);
    if (!policy || evaluator.evaluate(plannedLabels).context.status !== 'eligible') return {labels: plannedLabels};
    const evidence = assessLabelDependencyEvidence(input);
    const evaluation = evaluator.evaluate(plannedLabels, evidence);
    const zero = evaluation.assessments.find(item => item.facet === 'zero');
    if (parityPair(input.generatorId, input.viewId)) {
        // The positive source count does not describe a projection's empty group or remainder.
        // Explicit target claims must never be silently rewritten by artifact completion.
        if (!input.targetLabels || input.targetLabels.some(label => capabilitySatisfies(label, Scope.NumbersWithoutZero))
            || !plannedLabels.includes(Scope.NumbersWithoutZero)
            || !zero || !['missing', 'satisfied'].includes(zero.status)
            || zero.expectedLabels.length !== 1 || zero.expectedLabels[0] !== Scope.NumbersWithZero) {
            return {labels: plannedLabels};
        }
        const addedLabels = plannedLabels.includes(Scope.NumbersWithZero) ? [] : [Scope.NumbersWithZero];
        return {labels: ordered([...plannedLabels.filter(label => label !== Scope.NumbersWithoutZero), ...addedLabels]),
            receipt: {version: 1, policyHash: policy, mode: input.mode, plannedLabels, addedLabels,
                evidence: [{facet: 'zero', labels: zero.expectedLabels, references: zero.references}]}};
    }
    const assessment = evaluation.assessments.find(item => item.facet === 'operandDigits');
    const supported = assessment && (assessment.status === 'missing' || assessment.status === 'satisfied');
    const addedLabels = supported ? assessment.expectedLabels.filter(label => !plannedLabels.includes(label)) : [];
    const count = evaluation.assessments.find(item => item.facet === 'operandCount');
    const propertyCount = input.generatorId === 'arithmetic-ops-triples' && typeof input.data === 'object'
        && input.data !== null && 'propertyLaw' in input.data
        && count && (count.status === 'missing' || count.status === 'satisfied');
    if (propertyCount) addedLabels.push(...count.expectedLabels.filter(label => !plannedLabels.includes(label)));
    const addZeroAbsence = (input.generatorId === 'arithmetic-ops-pairs' || propertyCount)
        && !plannedLabels.includes(Scope.NumbersWithoutZero) && !plannedLabels.includes(Scope.NumbersWithZero)
        && zero && (zero.status === 'missing' || zero.status === 'satisfied')
        && zero.expectedLabels.length === 1 && zero.expectedLabels[0] === Scope.NumbersWithoutZero;
    if (addZeroAbsence) addedLabels.push(Scope.NumbersWithoutZero);
    const receipt: RealizedLabelReceipt = {version: 1, policyHash: policy, mode: input.mode,
        plannedLabels, addedLabels: ordered(addedLabels), evidence: [
            ...(supported ? [{facet: 'operandDigits' as const, labels: assessment.expectedLabels, references: assessment.references}] : []),
            ...(propertyCount ? [{facet: 'operandCount' as const, labels: count.expectedLabels, references: count.references}] : []),
            ...(addZeroAbsence ? [{facet: 'zero' as const, labels: [Scope.NumbersWithoutZero], references: zero.references}] : [])
        ]};
    return {labels: ordered([...plannedLabels, ...addedLabels]), receipt};
}
