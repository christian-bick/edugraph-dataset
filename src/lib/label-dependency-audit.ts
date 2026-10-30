import type {GenerationPlan, SelectedLabelChoice} from '../types/compatibility.ts';
import type {LabelDependencyEvaluation} from '../types/label-dependencies.ts';
import type {StoredDatasetRow} from './dataset-store.ts';
import {Area} from 'edugraph-ts/generated';
import {createGenerationSelectionReceipt, validateGenerationPlan} from './compatibility.ts';
import {digestIdentity} from './content-identity.ts';
import {parseSampleKey} from './generation.ts';
import {readSampleReplayRecord} from './sample-replay.ts';
import type {DependencyAuditAnnotationResolution} from './label-dependency-annotation-resolution.ts';

export const MAX_DEPENDENCY_AUDIT_SELECTIONS = 4096;
const ordered = (values: readonly string[]) => [...new Set(values)].sort();
const fieldKey = (field: {owner: string; field: string}) => JSON.stringify([field.owner, field.field]);
const message = (error: unknown) => error instanceof Error ? error.message : String(error);
const areaLabels = new Set<string>(Object.values(Area));

export interface DependencyAuditSelection {
    labels: string[];
    variantHash: string;
    choices: readonly SelectedLabelChoice[];
}

/** Enumerates whole admitted assignments from retained factors, never flattened alternatives. */
export function enumerateDependencyAuditSelections(planValue: GenerationPlan, limit = MAX_DEPENDENCY_AUDIT_SELECTIONS) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_DEPENDENCY_AUDIT_SELECTIONS) {
        throw new Error(`Selection limit must be an integer between 1 and ${MAX_DEPENDENCY_AUDIT_SELECTIONS}.`);
    }
    const plan = validateGenerationPlan(planValue);
    const grouped = new Set<string>();
    const factors: SelectedLabelChoice[][][] = plan.groups.map(group => {
        group.fields.forEach(field => grouped.add(fieldKey(field)));
        return group.assignments.map(assignment => group.fields.map((field, index) => ({
            ...field, alternativeId: assignment[index]
        })));
    });
    for (const domain of plan.domains) {
        if (!grouped.has(fieldKey(domain))) factors.push(domain.alternatives.map(alternative => [
            {owner: domain.owner, field: domain.field, alternativeId: alternative.id}
        ]));
    }
    const count = factors.reduce((total, factor) => total * BigInt(factor.length), 1n);
    const selections: DependencyAuditSelection[] = [];
    if (count > BigInt(limit)) return {status: 'limit_exceeded' as const, total: count.toString(), selections};
    const domains = new Map(plan.domains.map(domain => [fieldKey(domain), domain]));
    const visit = (index: number, choices: SelectedLabelChoice[]): void => {
        if (index < factors.length) {
            for (const factor of factors[index]) visit(index + 1, [...choices, ...factor]);
            return;
        }
        const receipt = createGenerationSelectionReceipt(plan, choices);
        const labels = ordered([...plan.generatorLabels, ...plan.viewLabels,
            ...receipt.choices.flatMap(choice => domains.get(fieldKey(choice))!.alternatives
                .find(alternative => alternative.id === choice.alternativeId)!.labels)]);
        selections.push({labels, variantHash: receipt.variantHash, choices: receipt.choices});
    };
    visit(0, []);
    return {status: 'complete' as const, total: count.toString(), selections};
}

/** Recover the whole recorded Area conjunction independently of potentially incomplete row labels. */
export function dependencyAuditResolvedAreas(row: StoredDatasetRow): {areas: string[]; issues: string[]} {
    try {
        const {recordedPlan: plan, replay} = readSampleReplayRecord(row.sample_key, row);
        const domains = new Map(plan.domains.map(domain => [fieldKey(domain), domain]));
        const labels = [...plan.generatorLabels, ...plan.viewLabels, ...replay.selection.choices.flatMap(choice =>
            domains.get(fieldKey(choice))!.alternatives.find(alternative => alternative.id === choice.alternativeId)!.labels)];
        return {areas: ordered(labels.filter(label => areaLabels.has(label))), issues: []};
    } catch (error) {
        return {areas: [], issues: [message(error)]};
    }
}

/** Validate every physical row before checking its annotation dependencies. */
export function dependencyAuditRowIssues(row: StoredDatasetRow, split: string): string[] {
    try {
        const identity = parseSampleKey(row.sample_key);
        const checks = [[identity.generatorId, row.generator, 'generator'], [identity.viewId, row.view, 'view'],
            [identity.targetId, row.target_id, 'target'], [identity.mode, row.mode, 'mode'], [identity.split, split, 'split']];
        return checks.filter(([expected, actual]) => expected !== actual)
            .map(([, , field]) => `Stored row ${field} disagrees with its sample key.`);
    } catch (error) {
        return [message(error)];
    }
}

export interface DependencyAuditSubject {
    kind: 'selection' | 'sample';
    id: string;
    targetId: string;
    generatorId: string;
    viewId: string;
    labels: readonly string[];
    /** Pre-resolution declarations are retained when configuration inference participates. */
    declaredLabels?: readonly string[];
    annotationResolution?: DependencyAuditAnnotationResolution;
    resolvedAreas?: readonly string[];
    planHash?: string;
    variantHash?: string;
    split?: string;
    mode?: string;
    fileName?: string;
    targetAssociations?: unknown;
    /** Structural annotation and row integrity issues. */
    issues?: readonly string[];
}

export interface DependencyAuditCoverage {
    targetId: string;
    generatorId: string;
    viewId: string;
    status: 'complete' | 'limit_exceeded' | 'invalid_plan';
    total: string;
    checked: number;
    reason?: string;
    /** Separate from exhaustive label-assignment enumeration. */
    annotationResolution?: {status: 'complete' | 'pending' | 'invalid'; exhaustive: number; pending: number; invalid: number};
}

export interface DependencyAuditReportInput {
    spec: string;
    policyHash: string;
    ontology: unknown;
    dataset: {status: 'available' | 'unavailable'; generationId: string | null};
    selectionCoverage: readonly DependencyAuditCoverage[];
    subjects: readonly DependencyAuditSubject[];
    evaluate: (labels: readonly string[], resolvedAreas?: readonly string[]) => LabelDependencyEvaluation;
}

/** Build one deterministic report without executing generators or changing annotations. */
export function buildLabelDependencyAudit(input: DependencyAuditReportInput) {
    const subjects = [...input.subjects].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
        .map(subject => ({...subject, labels: ordered(subject.labels), issues: ordered(subject.issues ?? []),
            evaluation: input.evaluate(subject.labels, subject.resolvedAreas)}));
    const selectionCoverage = [...input.selectionCoverage].sort((a, b) =>
        JSON.stringify([a.targetId, a.generatorId, a.viewId]).localeCompare(JSON.stringify([b.targetId, b.generatorId, b.viewId])));
    const summary = {
        selections: subjects.filter(subject => subject.kind === 'selection').length,
        samples: subjects.filter(subject => subject.kind === 'sample').length,
        contexts: {eligible: 0, outside_policy_scope: 0, invalid_context: 0},
        assessments: {satisfied: 0, missing: 0},
        conflicts: 0,
        samples_with_missing_dependencies: 0,
        row_issues: 0,
        contract_errors: 0,
        incomplete_tuples: selectionCoverage.filter(coverage => coverage.status !== 'complete').length,
        pending_inference_selections: subjects.filter(subject => subject.annotationResolution?.status === 'pending').length,
        invalid_inference_selections: subjects.filter(subject => subject.annotationResolution?.status === 'invalid').length,
        exhaustive_inference_selections: subjects.filter(subject => subject.annotationResolution?.status === 'exhaustive').length
    };
    const groups = new Map<string, {kind: string; generatorId: string; viewId: string; ruleId: string;
        facet: string; status: string; reason: string; labels: readonly string[]; subjects: string[]}>();
    for (const subject of subjects) {
        const evaluation = subject.evaluation;
        summary.contexts[evaluation.context.status]++;
        summary.row_issues += subject.issues.length;
        summary.contract_errors += evaluation.errors.length;
        summary.conflicts += evaluation.conflicts.length;
        if (subject.kind === 'sample' && evaluation.assessments.some(item => item.status === 'missing' && item.facet !== 'range')) {
            summary.samples_with_missing_dependencies++;
        }
        for (const assessment of evaluation.assessments) {
            summary.assessments[assessment.status]++;
            if (assessment.status === 'satisfied') continue;
            const group = {kind: subject.kind, generatorId: subject.generatorId, viewId: subject.viewId,
                ruleId: assessment.ruleId, facet: assessment.facet, status: assessment.status,
                reason: assessment.reason, labels: assessment.labels};
            const key = digestIdentity(group);
            const entry = groups.get(key) ?? {...group, subjects: []};
            entry.subjects.push(subject.id);
            groups.set(key, entry);
        }
    }
    return {schema_version: 4, mode: 'report-only', validation_basis: 'annotations', spec: input.spec, policy_hash: input.policyHash,
        ontology: input.ontology, dataset: input.dataset, summary, selection_coverage: selectionCoverage,
        findings: [...groups.entries()].sort(([a], [b]) => a < b ? -1 : 1).map(([, group]) => group), subjects};
}

const cell = (value: unknown) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const short = (labels: readonly string[]) => labels.map(label => label.replace('http://edugraph.io/edu/', '')).join(', ');

export function formatLabelDependencyAudit(report: ReturnType<typeof buildLabelDependencyAudit>): string {
    const {summary} = report;
    const lines = [`# Label dependency audit: ${report.spec}`, '',
        'Report only. Findings do not change generation, annotations, datasets, or VQA caches.', '',
        `- Policy: \`${report.policy_hash}\``,
        `- Dataset: ${report.dataset.status}; generation \`${report.dataset.generationId ?? 'none'}\``,
        `- Selections checked: ${summary.selections}; stored samples: ${summary.samples}`,
        `- Contexts: ${summary.contexts.eligible} eligible, ${summary.contexts.outside_policy_scope} outside policy, ${summary.contexts.invalid_context} invalid`,
        `- Annotation assessments: ${summary.assessments.satisfied} satisfied, ${summary.assessments.missing} missing; conflicts: ${summary.conflicts}`,
        `- Stored samples with missing non-range dependencies: ${summary.samples_with_missing_dependencies}`,
        `- Row issues: ${summary.row_issues}; label contract errors: ${summary.contract_errors}; incomplete tuples: ${summary.incomplete_tuples}`,
        `- Inference resolution: ${summary.exhaustive_inference_selections} exhaustive, ${summary.pending_inference_selections} pending, ${summary.invalid_inference_selections} invalid selections`, '',
        'Every eligible annotation set is checked directly. Contextual exclusions also reject forbidden claims outside the completeness allowlist. Strict mode enforces finalized samples; missing facets in pre-draw selections remain advisory. Range presence remains report-only; range-policy work is excluded.', '',
        '## Missing annotation dependencies', '',
        '| Source | Generator / view | Rule / facet | Present | Subjects | Reason |',
        '|---|---|---|---|---:|---|'];
    for (const finding of report.findings) lines.push(`| ${finding.kind} | ${cell(finding.generatorId)} / ${cell(finding.viewId)} | ${finding.ruleId} / ${finding.facet} | ${cell(short(finding.labels))} | ${finding.subjects.length} | ${cell(finding.reason)} |`);
    if (!report.findings.length) lines.push('| — | — | — | — | 0 | No activated annotation dependencies are missing. |');
    lines.push('', '## Annotation conflicts', '');
    if (!summary.conflicts) lines.push('None.');
    for (const subject of report.subjects) for (const conflict of subject.evaluation.conflicts) {
        lines.push(`- \`${subject.id}\`: ${conflict.ruleId}/${conflict.facet}: ${cell(short(conflict.labels))}. ${cell(conflict.reason)}`);
    }
    lines.push('', '## Selection coverage', '', '| Target | Generator / view | Status | Checked / admitted | Reason |', '|---|---|---|---:|---|');
    for (const coverage of report.selection_coverage.filter(item => item.status !== 'complete')) lines.push(
        `| ${cell(coverage.targetId)} | ${cell(coverage.generatorId)} / ${cell(coverage.viewId)} | ${coverage.status} | ${coverage.checked} / ${coverage.total} | ${cell(coverage.reason ?? '')} |`);
    lines.push('', '## Configuration inference coverage', '',
        'Only reviewed deterministic configuration outcomes are exhaustive. Potential outputs never satisfy a dependency. Pending inference keeps declared-only findings and blocks source readiness.', '');
    for (const subject of subjectsWithPendingInference(report.subjects)) {
        const resolution = subject.annotationResolution!;
        if (resolution.status === 'pending') lines.push(`- \`${subject.id}\`: pending — ${resolution.owners.map(owner => `${owner.owner}: ${owner.reason}`).join(' ')}`);
    }
    lines.push('', '## Annotation and row integrity issues', '');
    for (const subject of report.subjects) {
        for (const issue of [...subject.issues, ...subject.evaluation.errors]) lines.push(`- \`${subject.id}\`: ${cell(issue)}`);
    }
    lines.push('', 'The JSON report retains full labels, assessments, conflicts, and target/sample provenance for every subject.', '');
    return lines.join('\n');
}

const subjectsWithPendingInference = <T extends DependencyAuditSubject>(subjects: readonly T[]) =>
    subjects.filter(subject => subject.annotationResolution?.status === 'pending');
