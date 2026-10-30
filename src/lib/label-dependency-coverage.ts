import type {LabelDependencyEvaluation} from '../types/label-dependencies.ts';
import {labelDependencyCoverage} from '../validation/label-dependency-coverage.ts';
import {digestIdentity} from './content-identity.ts';
import {ResolvedLabelContractError} from './label-contracts.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import type {DependencyAuditCoverage, DependencyAuditSubject} from './label-dependency-audit.ts';

const ordered = (values: readonly string[]) => [...new Set(values)].sort();
const evaluator = createLabelDependencyEvaluator();
export const LABEL_DEPENDENCY_COVERAGE_HASH = digestIdentity({coverage: labelDependencyCoverage, dependencyPolicy: evaluator.policyHash});

export interface LabelDependencyCoverageFailure {
    code: 'context' | 'contract' | 'missing' | 'contradiction' | 'annotation' | 'enumeration' | 'dataset';
    message: string;
    ruleId?: string;
    facet?: string;
}

export interface LabelDependencyCoverageInput {
    generatorId: string;
    viewId: string;
    kind?: 'sample' | 'selection';
    labels: readonly string[];
    resolvedAreas?: readonly string[];
    /** Metadata/annotation integrity from the stored row and selected plan. */
    issues?: readonly string[];
}

export interface LabelDependencyCoverageResult {
    version: 2;
    coverageHash: string;
    status: 'checked' | 'outside_policy_scope' | 'invalid_context';
    completenessEnforced: boolean;
    checkedFacets: string[];
    reportOnlyFacets: string[];
    failures: LabelDependencyCoverageFailure[];
}

const facetKey = (ruleId: string, facet: string) => `${ruleId}/${facet}`;

/** Checks annotation contracts without payloads; contextual exclusions also apply outside completeness scope. */
export function assessLabelDependencyCoverage(input: LabelDependencyCoverageInput): LabelDependencyCoverageResult {
    // Supplied audit objects cannot override policy scope or dependency completeness.
    const evaluation = evaluator.evaluate(input.labels, input.resolvedAreas);
    const completenessEnforced = input.kind !== 'selection';
    const result: LabelDependencyCoverageResult = {version: 2, coverageHash: LABEL_DEPENDENCY_COVERAGE_HASH,
        status: 'checked', completenessEnforced, checkedFacets: [], reportOnlyFacets: [], failures: []};
    const fail = (code: LabelDependencyCoverageFailure['code'], message: string, extra: {ruleId?: string; facet?: string} = {}) =>
        result.failures.push({code, message, ...extra});
    for (const issue of ordered(input.issues ?? [])) fail('annotation', issue);
    for (const error of evaluation.errors) fail('contract', error);
    if (evaluation.context.status === 'invalid_context') {
        result.status = 'invalid_context';
        fail('context', 'The complete resolved Area context is invalid.');
        return result;
    }
    for (const conflict of evaluation.conflicts) fail('contradiction',
        `${conflict.ruleId}/${conflict.facet}: ${conflict.reason}`, {ruleId: conflict.ruleId, facet: conflict.facet});
    if (evaluation.context.status === 'outside_policy_scope') {
        result.status = 'outside_policy_scope';
        return result;
    }
    for (const assessment of evaluation.assessments) {
        const key = facetKey(assessment.ruleId, assessment.facet);
        const reportOnly = !completenessEnforced || (labelDependencyCoverage.reportOnlyFacets as readonly string[]).includes(assessment.facet);
        (reportOnly ? result.reportOnlyFacets : result.checkedFacets).push(key);
        if (!reportOnly && assessment.status === 'missing') fail('missing',
            `${key}: ${assessment.reason}`, {ruleId: assessment.ruleId, facet: assessment.facet});
    }
    result.checkedFacets = ordered(result.checkedFacets);
    result.reportOnlyFacets = ordered(result.reportOnlyFacets);
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
    subjects: readonly (DependencyAuditSubject & {evaluation: LabelDependencyEvaluation})[];
    selection_coverage: readonly DependencyAuditCoverage[];
}) {
    const subjects = [...input.subjects].sort((a, b) => a.id.localeCompare(b.id)).map(subject => ({id: subject.id, kind: subject.kind,
        ...assessLabelDependencyCoverage(subject)}));
    const failures = subjects.flatMap(subject => subject.failures.map(failure => ({subject: subject.id, ...failure})));
    if (input.dataset.status !== 'available' || !input.dataset.generationId) failures.push({subject: 'dataset', code: 'dataset', message: 'No immutable dataset snapshot is available.'});
    else if (!input.subjects.some(subject => subject.kind === 'sample')) failures.push({subject: 'dataset', code: 'dataset', message: 'No stored samples are available for dependency validation.'});
    for (const coverage of [...input.selection_coverage].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))) {
        if (coverage.status !== 'complete') failures.push({subject: `selection:${JSON.stringify([coverage.targetId, coverage.generatorId, coverage.viewId])}`,
            code: 'enumeration', message: coverage.reason ?? `Selection enumeration is ${coverage.status}.`});
        if (coverage.annotationResolution && coverage.annotationResolution.status !== 'complete') failures.push({
            subject: `selection:${JSON.stringify([coverage.targetId, coverage.generatorId, coverage.viewId])}`,
            code: 'enumeration', message: `Configuration inference coverage is ${coverage.annotationResolution.status}; potential outputs cannot establish source readiness.`});
    }
    const counts = {checked: 0, samples_checked: 0, selections_checked: 0, outside_policy_scope: 0, invalid_context: 0,
        checked_facets: 0, report_only_facets: 0, failures: failures.length};
    for (const subject of subjects) {
        counts[subject.status]++;
        if (subject.status === 'checked') counts[subject.kind === 'sample' ? 'samples_checked' : 'selections_checked']++;
        counts.checked_facets += subject.checkedFacets.length;
        counts.report_only_facets += subject.reportOnlyFacets.length;
    }
    return {version: 2, coverage_hash: LABEL_DEPENDENCY_COVERAGE_HASH, scope: labelDependencyCoverage.scope,
        report_only_facets: [...labelDependencyCoverage.reportOnlyFacets],
        report_only_completeness_kinds: [...labelDependencyCoverage.reportOnlyCompletenessKinds], counts, failures, subjects};
}
