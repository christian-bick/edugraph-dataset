import type {GenerationPlan, SelectedLabelChoice} from '../types/compatibility.ts';
import type {LabelDependencyEvaluation, LabelDependencyEvidence} from '../types/label-dependencies.ts';
import type {ProblemGenerator} from '../types/ml-engine.ts';
import type {ConfigSchema} from '../types/schema.ts';
import type {StoredDatasetRow} from './dataset-store.ts';
import {Area} from 'edugraph-ts/generated';
import type {DependencyGraphSnapshot} from './dependency-planner.ts';
import {createGenerationSelectionReceipt, validateGenerationPlan} from './compatibility.ts';
import {digestIdentity} from './content-identity.ts';
import {computeContentFingerprint, computeTaskFingerprint, parseSampleKey} from './generation.ts';
import {resolvePlannedConfigurations} from './planned-generation.ts';
import {completeRealizedLabels} from './realized-labels.ts';
import {readSampleReplayRecord} from './sample-replay.ts';
import {getRandomState, setRandomState} from './random.ts';
import {assessLabelDependencyEvidence} from './label-dependency-evidence.ts';

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

/** Validate every physical row, including families without an evidence adapter. */
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

/** Stored module nodes already list their complete authored source closure. */
export function dependencyAuditSourceIssues(input: {
    graph?: DependencyGraphSnapshot;
    generatorId: string;
    viewId: string;
    sourceHash: (path: string) => string | undefined;
}): string[] {
    const issues: string[] = [];
    for (const [kind, id] of [['generator', input.generatorId], ['view', input.viewId]] as const) {
        const module = input.graph?.nodes[`${kind}:${id}`];
        if (!module || module.kind !== `${kind}-module`) {
            issues.push(`No stored ${kind} source identity for ${id}.`);
            continue;
        }
        const sources = module.dependencies.filter(dependency => dependency.startsWith('source:'));
        if (!sources.length) issues.push(`No stored ${kind} source closure for ${id}.`);
        for (const source of sources) {
            const node = input.graph?.nodes[source];
            const path = source.slice('source:'.length);
            if (node?.kind !== 'source-file' || input.sourceHash(path) !== node.input_hash) {
                issues.push(`Stored evidence source is stale or unavailable: ${path}.`);
            }
        }
    }
    return ordered(issues);
}

/** Replay is evidence only after exact origin, current plan, source, and fingerprints agree. */
export function replayDependencyAuditRow(input: {
    row: StoredDatasetRow;
    currentPlan?: GenerationPlan;
    generator?: ProblemGenerator;
    viewSchema?: ConfigSchema;
    sourceIssues: readonly string[];
}): {evidence: LabelDependencyEvidence; issues: string[]; status: 'verified' | 'unresolved'} {
    const fallback = () => assessLabelDependencyEvidence({generatorId: input.row.generator,
        viewId: input.row.view, mode: input.row.mode === 'solution' ? 'solution' : 'question'});
    const issues = [...input.sourceIssues];
    const state = getRandomState();
    try {
        const identity = parseSampleKey(input.row.sample_key);
        if (identity.generatorId !== input.row.generator || identity.viewId !== input.row.view
            || identity.targetId !== input.row.target_id || identity.mode !== input.row.mode) {
            throw new Error('Stored row identity disagrees with its sample key.');
        }
        const recorded = readSampleReplayRecord(input.row.sample_key, input.row);
        if (!input.currentPlan || recorded.recordedPlan.hash !== input.currentPlan.hash
            || recorded.recordedPlan.inputHash !== input.currentPlan.inputHash) {
            throw new Error('Stored generation plan is stale or has no current matching tuple.');
        }
        if (issues.length) return {evidence: fallback(), issues: ordered(issues), status: 'unresolved'};
        if (!input.generator || !input.viewSchema) throw new Error('Replay implementation is unavailable.');
        // Diagnostic replay reconstructs data without enforcing the annotations being audited.
        const draw = resolvePlannedConfigurations({generatorSchema: input.generator.schema, viewSchema: input.viewSchema,
            plan: input.currentPlan, sampleKey: recorded.replay.sampleKey, attempt: recorded.attempt,
            seed: recorded.replay.seed, replay: recorded.replay});
        setRandomState(draw.generatorRandomState);
        const stub = input.generator.generate(draw.generatorConfig);
        if (!stub) throw new Error('Recorded draw returned no mathematical payload.');
        if (computeContentFingerprint(stub.data) !== input.row.content_fingerprint
            || computeTaskFingerprint(stub.data, draw.view.config) !== input.row.task_fingerprint) {
            throw new Error('Replayed content/task fingerprint disagrees with the stored artifact.');
        }
        const completed = completeRealizedLabels({generatorId: identity.generatorId, viewId: identity.viewId,
            mode: identity.mode, data: stub.data, plannedLabels: draw.labels, targetLabels: input.currentPlan.targetLabels});
        if (input.row.realized_labels !== undefined
            && digestIdentity(input.row.realized_labels) !== digestIdentity(completed.receipt)) {
            issues.push('Stored realized-label receipt disagrees with the current evidence policy; payload fingerprints are verified.');
        }
        return {evidence: assessLabelDependencyEvidence({generatorId: identity.generatorId,
            viewId: identity.viewId, mode: identity.mode, data: stub.data}), issues: ordered(issues), status: 'verified'};
    } catch (error) {
        issues.push(message(error));
        return {evidence: fallback(), issues: ordered(issues), status: 'unresolved'};
    } finally {
        setRandomState(state);
    }
}

export interface DependencyAuditSubject {
    kind: 'selection' | 'sample';
    id: string;
    targetId: string;
    generatorId: string;
    viewId: string;
    labels: readonly string[];
    resolvedAreas?: readonly string[];
    planHash?: string;
    variantHash?: string;
    split?: string;
    mode?: string;
    fileName?: string;
    targetAssociations?: unknown;
    evidence: LabelDependencyEvidence;
    replay?: 'verified' | 'unresolved' | 'unsupported' | 'not_requested';
    /** Structural annotation/row integrity issues, independent of optional payload evidence. */
    issues?: readonly string[];
    evidenceIssues?: readonly string[];
}

export interface DependencyAuditCoverage {
    targetId: string;
    generatorId: string;
    viewId: string;
    status: 'complete' | 'limit_exceeded' | 'invalid_plan';
    total: string;
    checked: number;
    reason?: string;
}

export interface DependencyAuditReportInput {
    spec: string;
    policyHash: string;
    ontology: unknown;
    dataset: {status: 'available' | 'unavailable'; generationId: string | null};
    selectionCoverage: readonly DependencyAuditCoverage[];
    subjects: readonly DependencyAuditSubject[];
    evaluate: (labels: readonly string[], evidence: LabelDependencyEvidence, resolvedAreas?: readonly string[]) => LabelDependencyEvaluation;
}

/** Build one deterministic report. Findings never change labels, plans, artifacts, or caches. */
export function buildLabelDependencyAudit(input: DependencyAuditReportInput) {
    const subjects = [...input.subjects].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
        .map(subject => ({...subject, labels: ordered(subject.labels), issues: ordered(subject.issues ?? []),
            evidenceIssues: ordered(subject.evidenceIssues ?? []),
            evaluation: input.evaluate(subject.labels, subject.evidence, subject.resolvedAreas)}));
    const selectionCoverage = [...input.selectionCoverage].sort((a, b) =>
        JSON.stringify([a.targetId, a.generatorId, a.viewId]).localeCompare(JSON.stringify([b.targetId, b.generatorId, b.viewId])));
    const summary = {
        selections: subjects.filter(subject => subject.kind === 'selection').length,
        samples: subjects.filter(subject => subject.kind === 'sample').length,
        contexts: {eligible: 0, outside_policy_scope: 0, invalid_context: 0},
        assessments: {satisfied: 0, missing: 0, not_applicable: 0, unresolved: 0},
        evidence_assessments: {satisfied: 0, missing: 0, not_applicable: 0, unresolved: 0},
        conflicts: 0,
        samples_with_missing_dependencies: 0,
        unresolved_triggers: 0,
        row_issues: 0,
        evidence_issues: 0,
        evidence_contract_errors: 0,
        contract_errors: 0,
        incomplete_tuples: selectionCoverage.filter(coverage => coverage.status !== 'complete').length,
        replay: {verified: 0, unresolved: 0, unsupported: 0, not_requested: 0},
        adapters: {} as Record<string, number>
    };
    const groups = new Map<string, {channel: 'annotation' | 'evidence'; kind: string; generatorId: string; viewId: string; ruleId: string;
        facet: string; status: string; reason: string; labels: readonly string[]; expectedLabels: readonly string[];
        subjects: string[]}>();
    for (const subject of subjects) {
        const evaluation = subject.evaluation;
        summary.contexts[evaluation.context.status]++;
        summary.row_issues += subject.issues.length;
        summary.evidence_issues += subject.evidenceIssues.length;
        summary.contract_errors += evaluation.errors.length;
        summary.evidence_contract_errors += evaluation.evidenceErrors?.length ?? 0;
        summary.conflicts += evaluation.conflicts?.length ?? 0;
        if (subject.kind === 'sample' && evaluation.assessments.some(item => item.status === 'missing' && item.facet !== 'range')) {
            summary.samples_with_missing_dependencies++;
        }
        if (subject.replay) summary.replay[subject.replay]++;
        summary.adapters[subject.evidence.adapter] = (summary.adapters[subject.evidence.adapter] ?? 0) + 1;
        summary.unresolved_triggers += (evaluation.evidenceTriggers ?? []).filter(trigger => trigger.status === 'unresolved').length;
        for (const [channel, assessments] of [
            ['annotation', evaluation.assessments], ['evidence', evaluation.evidenceAssessments ?? []]
        ] as const) for (const assessment of assessments) {
            (channel === 'annotation' ? summary.assessments : summary.evidence_assessments)[assessment.status]++;
            if (assessment.status === 'satisfied' || assessment.status === 'not_applicable') continue;
            const group = {channel, kind: subject.kind, generatorId: subject.generatorId, viewId: subject.viewId,
                ruleId: assessment.ruleId, facet: assessment.facet, status: assessment.status,
                reason: assessment.reason, labels: assessment.labels, expectedLabels: assessment.expectedLabels};
            const key = digestIdentity(group);
            const entry = groups.get(key) ?? {...group, subjects: []};
            entry.subjects.push(subject.id);
            groups.set(key, entry);
        }
    }
    summary.adapters = Object.fromEntries(Object.entries(summary.adapters).sort(([a], [b]) => a < b ? -1 : 1));
    const findings = [...groups.entries()].sort(([a], [b]) => a < b ? -1 : 1).map(([, group]) => group);
    return {schema_version: 2, mode: 'report-only', validation_basis: 'annotations', spec: input.spec, policy_hash: input.policyHash,
        ontology: input.ontology, dataset: input.dataset, summary, selection_coverage: selectionCoverage,
        findings: findings.filter(finding => finding.channel === 'annotation'),
        evidence_findings: findings.filter(finding => finding.channel === 'evidence'), subjects};
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
        `- Row issues: ${summary.row_issues}; label contract errors: ${summary.contract_errors}; incomplete tuples: ${summary.incomplete_tuples}`, '',
        'Every eligible annotation set is checked independently of evidence adapters. Strict mode enforces finalized samples; missing facets in pre-draw selections remain advisory. Range presence remains report-only; range-policy work is excluded.', '',
        '## Missing annotation dependencies', '',
        '| Source | Generator / view | Rule / facet | Status | Present | Expected | Subjects | Reason |',
        '|---|---|---|---|---|---|---:|---|'];
    for (const finding of report.findings) lines.push(`| ${finding.kind} | ${cell(finding.generatorId)} / ${cell(finding.viewId)} | ${finding.ruleId} / ${finding.facet} | ${finding.status} | ${cell(short(finding.labels))} | ${cell(short(finding.expectedLabels))} | ${finding.subjects.length} | ${cell(finding.reason)} |`);
    if (!report.findings.length) lines.push('| — | — | — | — | — | — | 0 | No activated annotation dependencies are missing. |');
    lines.push('', '## Annotation conflicts', '');
    for (const subject of report.subjects) for (const conflict of subject.evaluation.conflicts ?? []) {
        lines.push(`- \`${subject.id}\`: ${cell(JSON.stringify(conflict))}`);
    }
    lines.push('', '## Selection coverage', '', '| Target | Generator / view | Status | Checked / admitted | Reason |', '|---|---|---|---:|---|');
    for (const coverage of report.selection_coverage.filter(item => item.status !== 'complete')) lines.push(
        `| ${cell(coverage.targetId)} | ${cell(coverage.generatorId)} / ${cell(coverage.viewId)} | ${coverage.status} | ${coverage.checked} / ${coverage.total} | ${cell(coverage.reason ?? '')} |`);
    lines.push('', '## Supplementary exercise evidence', '',
        'Evidence diagnostics do not determine annotation completeness or strict-gate coverage. Use `--with-evidence` to reconstruct reviewed payloads.', '',
        `- Assessments: ${summary.evidence_assessments.satisfied} satisfied, ${summary.evidence_assessments.missing} missing, ${summary.evidence_assessments.not_applicable} not applicable, ${summary.evidence_assessments.unresolved} unresolved`,
        `- Unresolved evidence triggers: ${summary.unresolved_triggers}; evidence issues: ${summary.evidence_issues}; evidence contract errors: ${summary.evidence_contract_errors}`,
        `- Replay: ${summary.replay.verified} verified, ${summary.replay.unresolved} unresolved, ${summary.replay.unsupported} unsupported, ${summary.replay.not_requested} not requested`, '',
        '| Adapter | Subjects |', '|---|---:|');
    for (const [adapter, count] of Object.entries(summary.adapters)) lines.push(`| ${cell(adapter)} | ${count} |`);
    const unresolvedTriggers = new Map<string, {kind: string; generatorId: string; viewId: string; ruleId: string; count: number}>();
    for (const subject of report.subjects) for (const trigger of subject.evaluation.evidenceTriggers ?? []) {
        if (trigger.status !== 'unresolved') continue;
        const key = JSON.stringify([subject.kind, subject.generatorId, subject.viewId, trigger.ruleId]);
        const group = unresolvedTriggers.get(key) ?? {kind: subject.kind, generatorId: subject.generatorId,
            viewId: subject.viewId, ruleId: trigger.ruleId, count: 0};
        group.count++;
        unresolvedTriggers.set(key, group);
    }
    lines.push('', '## Unresolved supplementary triggers', '',
        '| Source | Generator / view | Rule | Status | Subjects |', '|---|---|---|---|---:|');
    for (const [, group] of [...unresolvedTriggers].sort(([a], [b]) => a < b ? -1 : 1)) {
        lines.push(`| ${group.kind} | ${cell(group.generatorId)} / ${cell(group.viewId)} | ${group.ruleId} | trigger unresolved | ${group.count} |`);
    }
    lines.push('', '## Supplementary missing and unresolved assessments', '',
        '| Source | Generator / view | Rule / facet | Status | Present | Expected | Subjects | Reason |',
        '|---|---|---|---|---|---|---:|---|');
    for (const finding of report.evidence_findings) lines.push(`| ${finding.kind} | ${cell(finding.generatorId)} / ${cell(finding.viewId)} | ${finding.ruleId} / ${finding.facet} | ${finding.status} | ${cell(short(finding.labels))} | ${cell(short(finding.expectedLabels))} | ${finding.subjects.length} | ${cell(finding.reason)} |`);
    lines.push('', '## Annotation and row integrity issues', '');
    for (const subject of report.subjects) {
        for (const issue of [...subject.issues, ...subject.evaluation.errors]) lines.push(`- \`${subject.id}\`: ${cell(issue)}`);
    }
    lines.push('', '## Supplementary evidence issues', '');
    for (const subject of report.subjects) {
        for (const issue of [...subject.evidenceIssues, ...(subject.evaluation.evidenceErrors ?? [])]) lines.push(`- \`${subject.id}\`: ${cell(issue)}`);
    }
    lines.push('', 'The JSON report retains full labels, evidence references, assessments, and target/sample provenance for every subject.', '');
    return lines.join('\n');
}
