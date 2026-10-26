import {Scope} from 'edugraph-ts/generated';
import type {LabelDependencyEvidence, LabelDependencyEvaluation} from '../types/label-dependencies.ts';
import {labelDependencyCoverage} from '../validation/label-dependency-coverage.ts';
import {labelDependencies} from '../validation/label-dependencies.ts';
import {digestIdentity} from './content-identity.ts';
import {ResolvedLabelContractError} from './label-contracts.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import type {DependencyAuditCoverage, DependencyAuditSubject} from './label-dependency-audit.ts';

type ArithmeticVariant = 'integer-equation' | 'property-commutative' | 'property-associative' | 'property-distributive';
type ArithmeticProfile = keyof typeof labelDependencyCoverage.profiles;
export type LabelDependencyVariant = `${ArithmeticVariant}/${ArithmeticProfile}`
    | 'object-counting' | 'count-out' | 'unresolved-payload' | 'uncovered';

const ordered = (values: readonly string[]) => [...new Set(values)].sort();
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const evaluator = createLabelDependencyEvaluator();
export const LABEL_DEPENDENCY_COVERAGE_HASH = digestIdentity({coverage: labelDependencyCoverage, dependencyPolicy: evaluator.policyHash});
const arithmeticArities: Readonly<Record<string, number>> = {'arithmetic-ops-pairs': 2, 'arithmetic-ops-triples': 3, 'arithmetic-ops-four': 4};
const arithmeticView = (view: string) => (labelDependencyCoverage.arithmeticViews as readonly string[]).includes(view);
const countingContract = (generator: string, view: string) => labelDependencyCoverage.counting.find(contract =>
    contract.generator === generator && (contract.views as readonly string[]).includes(view));
export const hasLabelDependencyCoverage = (generator: string, view: string) => Boolean(Object.hasOwn(arithmeticArities, generator) && arithmeticView(view)
    || countingContract(generator, view));

/** A variant chooses reviewed obligations; applicability and mathematical correctness still come from evidence. */
export function classifyLabelDependencyVariant(input: {generatorId: string; viewId: string; mode: string; data?: unknown}): LabelDependencyVariant {
    if (!hasLabelDependencyCoverage(input.generatorId, input.viewId)) return 'uncovered';
    const data = input.data;
    if (!object(data)) return 'unresolved-payload';
    const counting = countingContract(input.generatorId, input.viewId);
    if (counting) return Number.isSafeInteger(data.numObjects) ? counting.variant : 'unresolved-payload';
    const operands = Array.from({length: arithmeticArities[input.generatorId]}, (_, index) => data[`num${index + 1}`]);
    if (operands.some(value => typeof value !== 'number' || !Number.isSafeInteger(value))) return 'unresolved-payload';
    const law = data.propertyLaw;
    if (law !== undefined && (input.generatorId !== 'arithmetic-ops-triples' || typeof law !== 'string'
        || !['commutative', 'associative', 'distributive'].includes(law))) return 'unresolved-payload';
    const variant: ArithmeticVariant = law === undefined ? 'integer-equation' : `property-${law}` as ArithmeticVariant;
    const underdetermined = input.mode === 'question' && input.viewId.endsWith('-inversion')
        && (data.operation === 'multiplication'
            && (law === 'distributive' ? data.num1 === 0 : operands.some((value, index) => index !== 1 && value === 0))
            || data.operation === 'division' && data.num1 === 0);
    const profile: ArithmeticProfile = underdetermined ? 'underdetermined'
        : (operands as number[]).some(value => value < 0) ? 'signed' : 'nonnegative';
    return `${variant}/${profile}`;
}

export interface LabelDependencyCoverageFailure {
    code: 'context' | 'contract' | 'evidence' | 'replay' | 'coverage' | 'trigger' | 'missing' | 'unresolved' | 'contradiction' | 'enumeration' | 'dataset';
    message: string;
    ruleId?: string;
    facet?: string;
}

export interface LabelDependencyCoverageInput {
    generatorId: string;
    viewId: string;
    mode?: string;
    kind?: 'sample' | 'selection';
    labels: readonly string[];
    evidence: LabelDependencyEvidence;
    data?: unknown;
    coverageVariant?: string;
    evaluation?: LabelDependencyEvaluation;
    resolvedAreas?: readonly string[];
    issues?: readonly string[];
    replay?: 'verified' | 'unresolved' | 'unsupported';
}

export interface LabelDependencyCoverageResult {
    version: 1;
    coverageHash: string;
    status: 'covered' | 'deferred' | 'uncovered' | 'outside_policy_scope' | 'invalid_context';
    variant: string;
    coveredFacets: string[];
    deferredFacets: string[];
    uncoveredFacets: string[];
    uncoveredRules: string[];
    failures: LabelDependencyCoverageFailure[];
}

const facetRule = (facet: string): string => labelDependencies.rules.find(rule => (rule.assess as readonly string[]).includes(facet))!.id;
const facetKey = (ruleId: string, facet: string) => `${ruleId}/${facet}`;

/** Enforces only declared producer/projection/variant/facet coverage, never a convenient passing subset. */
export function assessLabelDependencyCoverage(input: LabelDependencyCoverageInput): LabelDependencyCoverageResult {
    const evaluation = input.evaluation ?? evaluator.evaluate(input.labels, input.evidence, input.resolvedAreas);
    const variant = input.kind === 'selection' ? 'selection'
        : input.coverageVariant ?? classifyLabelDependencyVariant({...input, mode: input.mode ?? 'question'});
    const result: LabelDependencyCoverageResult = {version: 1, coverageHash: LABEL_DEPENDENCY_COVERAGE_HASH,
        status: 'uncovered', variant, coveredFacets: [], deferredFacets: [], uncoveredFacets: [],
        uncoveredRules: labelDependencies.rules.map(rule => rule.id), failures: []};
    const fail = (code: LabelDependencyCoverageFailure['code'], message: string, extra: {ruleId?: string; facet?: string} = {}) =>
        result.failures.push({code, message, ...extra});
    for (const issue of ordered(input.issues ?? [])) fail('evidence', issue);
    for (const error of evaluation.errors) fail('contract', error);
    if (input.replay === 'unresolved') fail('replay', 'Stored evidence replay is unresolved.');
    if (evaluation.context.status === 'invalid_context') {
        result.status = 'invalid_context';
        fail('context', 'The complete resolved Area context is invalid.');
        return result;
    }
    if (evaluation.context.status === 'outside_policy_scope') {
        result.status = 'outside_policy_scope';
        return result;
    }
    const registered = hasLabelDependencyCoverage(input.generatorId, input.viewId);
    if (!registered) {
        result.uncoveredFacets = ordered(evaluation.assessments.map(assessment => facetKey(assessment.ruleId, assessment.facet)));
        return result;
    }
    if (input.kind === 'selection') {
        result.status = 'deferred';
        const facets: string[] = [...labelDependencyCoverage.countingFacets];
        if (arithmeticArities[input.generatorId]) facets.push(...labelDependencyCoverage.profiles.nonnegative.operands);
        if ((labelDependencyCoverage.explanationViews as readonly string[]).includes(input.viewId)) facets.push('articulation');
        result.deferredFacets = ordered(facets.map(facet => facetKey(facetRule(facet), facet)));
        result.uncoveredRules = result.uncoveredRules.filter(ruleId => !facets.some(facet => facetRule(facet) === ruleId));
        return result;
    }
    if (input.replay === 'unsupported') fail('replay', 'A reviewed producer/projection has no verified stored evidence replay.');
    if (input.data === undefined && input.coverageVariant !== undefined && input.replay !== 'verified') {
        fail('coverage', 'A stored coverage variant requires verified replay when no mathematical payload is supplied.');
    }
    if (input.data !== undefined && input.coverageVariant !== undefined
        && variant !== classifyLabelDependencyVariant({...input, mode: input.mode ?? 'question'})) {
        fail('coverage', 'Declared coverage variant disagrees with the mathematical payload.');
    }
    let facets: string[] = [];
    let deferred: readonly string[] = [];
    const counting = countingContract(input.generatorId, input.viewId);
    if (counting && variant === counting.variant) {
        facets = [...labelDependencyCoverage.countingFacets];
        if ((labelDependencyCoverage.explanationViews as readonly string[]).includes(input.viewId)) facets.push('articulation');
    } else if (!counting) {
        const [base, profile] = variant.split('/');
        const contract = labelDependencyCoverage.arithmetic.find(contract => (contract.generators as readonly string[]).includes(input.generatorId)
            && (contract.variants as readonly string[]).includes(base));
        if (contract && Object.hasOwn(labelDependencyCoverage.profiles, profile)
            && !(profile === 'underdetermined' && (input.mode !== 'question' || !input.viewId.endsWith('-inversion')))) {
            const policy = labelDependencyCoverage.profiles[profile as ArithmeticProfile];
            facets = [...policy.numeric, ...policy.operands];
            deferred = policy.deferred;
        }
    }
    if (!facets.length) {
        fail('coverage', `No reviewed payload variant '${variant}' for ${input.generatorId}/${input.viewId}.`);
        return result;
    }
    result.status = 'covered';
    result.coveredFacets = ordered(facets.map(facet => facetKey(facetRule(facet), facet)));
    result.deferredFacets = ordered(deferred.map(facet => facetKey(facetRule(facet), facet)));
    const coveredRules = new Set(facets.map(facetRule));
    result.uncoveredRules = result.uncoveredRules.filter(ruleId => !coveredRules.has(ruleId));
    result.uncoveredFacets = ordered(evaluation.assessments.map(assessment => facetKey(assessment.ruleId, assessment.facet))
        .filter(key => !result.coveredFacets.includes(key) && !result.deferredFacets.includes(key)));
    for (const ruleId of coveredRules) {
        const trigger = evaluation.triggers.find(trigger => trigger.ruleId === ruleId);
        if (!trigger || trigger.status !== 'present') fail('trigger', `Reviewed rule ${ruleId} has no established applicable trigger.`, {ruleId});
    }
    for (const key of result.coveredFacets) {
        const [ruleId, facet] = key.split('/');
        const assessment = evaluation.assessments.find(assessment => assessment.ruleId === ruleId && assessment.facet === facet);
        if (!assessment) fail('unresolved', `No assessment for covered facet ${key}.`, {ruleId, facet});
        else if (assessment.status === 'missing' || assessment.status === 'unresolved') fail(assessment.status,
            `${key}: ${assessment.reason}`, {ruleId, facet});
        if (facet === 'zero' || facet === 'sign') {
            const opposite = facet === 'zero' ? [Scope.NumbersWithZero, Scope.NumbersWithoutZero]
                : [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives];
            if (opposite.every(label => input.labels.includes(label))) fail('contradiction',
                `${key}: opposing presence and absence claims cannot both hold.`, {ruleId, facet});
        }
    }
    return result;
}

/** Dependency failures are annotation contracts, so orchestration must not retry or mask them. */
export class LabelDependencyCoverageError extends ResolvedLabelContractError {}

export function assertLabelDependencyCoverage(input: LabelDependencyCoverageInput, location = 'artifact'): LabelDependencyCoverageResult {
    const result = assessLabelDependencyCoverage(input);
    if (result.failures.length) throw new LabelDependencyCoverageError(result.failures.map(failure => `${location}: ${failure.message}`).join('\n'));
    return result;
}

export function summarizeLabelDependencyCoverage(input: {
    dataset: {status: string; generationId: string | null};
    subjects: readonly (Omit<DependencyAuditSubject, 'coverageVariant'> & {coverageVariant?: string; evaluation: LabelDependencyEvaluation})[];
    selection_coverage: readonly DependencyAuditCoverage[];
}) {
    const subjects = [...input.subjects].sort((a, b) => a.id.localeCompare(b.id)).map(subject => ({id: subject.id,
        ...assessLabelDependencyCoverage({...subject, mode: subject.mode ?? 'question'})}));
    const failures = subjects.flatMap(subject => subject.failures.map(failure => ({subject: subject.id, ...failure})));
    if (input.dataset.status !== 'available' || !input.dataset.generationId) failures.push({subject: 'dataset', code: 'dataset', message: 'No immutable dataset snapshot is available.'});
    else if (!input.subjects.some(subject => subject.kind === 'sample')) failures.push({subject: 'dataset', code: 'dataset', message: 'No stored samples are available for dependency validation.'});
    for (const coverage of [...input.selection_coverage].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))) {
        if (coverage.status !== 'complete') failures.push({subject: `selection:${JSON.stringify([coverage.targetId, coverage.generatorId, coverage.viewId])}`,
            code: 'enumeration', message: coverage.reason ?? `Selection enumeration is ${coverage.status}.`});
    }
    const counts = {covered: 0, deferred: 0, uncovered: 0, outside_policy_scope: 0, invalid_context: 0,
        covered_facets: 0, deferred_facets: 0, uncovered_facets: 0, failures: failures.length};
    for (const subject of subjects) {
        counts[subject.status]++;
        counts.covered_facets += subject.coveredFacets.length;
        counts.deferred_facets += subject.deferredFacets.length;
        counts.uncovered_facets += subject.uncoveredFacets.length;
    }
    return {version: 1, coverage_hash: LABEL_DEPENDENCY_COVERAGE_HASH, report_only_facets: [...labelDependencyCoverage.reportOnlyFacets], counts, failures, subjects};
}
