import {resolve} from 'node:path';
import {digestFile, digestIdentity} from './content-identity.ts';
import {resolveOntologyProvenance} from './coverage-identity.ts';
import {datasetDirForSpec, datasetOutDir} from './dataset-paths.ts';
import {readDatasetSnapshot, type DatasetSnapshot} from './dataset-store.ts';
import {buildCompatibleModulePairIndex, matchTargets} from './matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from './model-catalog.ts';
import {loadMatchingTargets} from './spec-validator.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import {Area} from 'edugraph-ts/generated';
import {resolveDependencyAuditAnnotation} from './label-dependency-annotation-resolution.ts';
import {buildLabelDependencyAudit, dependencyAuditResolvedAreas, dependencyAuditRowIssues, MAX_DEPENDENCY_AUDIT_SELECTIONS,
    enumerateDependencyAuditSelections,
    type DependencyAuditCoverage, type DependencyAuditSubject} from './label-dependency-audit.ts';

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);
const tupleKey = (target: string, generator: string, view: string) => JSON.stringify([target, generator, view]);

/** Check one immutable dataset's annotations without executing generators or inspecting payloads. */
export async function inspectLabelDependencies(input: {
    projectRoot: string; spec: string; maxSelections?: number; snapshot?: DatasetSnapshot;
}) {
    const {projectRoot: PROJECT_ROOT, spec, maxSelections: limit} = input;
    if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_DEPENDENCY_AUDIT_SELECTIONS)) {
        throw new Error(`Selection limit must be an integer between 1 and ${MAX_DEPENDENCY_AUDIT_SELECTIONS}.`);
    }
    const datasetDir = datasetOutDir(PROJECT_ROOT, datasetDirForSpec(spec));
    const evaluator = createLabelDependencyEvaluator();
    const ontology = resolveOntologyProvenance(PROJECT_ROOT);
    const sources = ['src/types/label-dependencies.ts', 'src/validation/label-dependencies.ts',
        'src/lib/label-dependencies.ts', 'src/types/module-spec.ts', 'src/lib/inferred-labels.ts',
        'src/lib/static-resolvers.ts', 'src/lib/static-schema-resolution.ts',
        'src/lib/label-dependency-annotation-resolution.ts',
        'src/lib/resolvers.ts', 'src/lib/ontology.ts', 'src/lib/schema-choices.ts', 'src/lib/random.ts',
        'src/lib/label-contracts.ts', 'src/lib/spec-ownership.ts',
        'src/lib/label-dependency-audit.ts', 'src/lib/label-dependency-inspection.ts',
        'src/lib/label-dependency-coverage.ts', 'src/validation/label-dependency-coverage.ts',
        'src/scripts/audit-label-dependencies.ts'];
    const policyHash = digestIdentity({evaluator: evaluator.policyHash, ontology,
        implementation: sources.map(path => ({path, ...digestFile(resolve(PROJECT_ROOT, path))}))});
    const [targets, generators, views] = await Promise.all([
        loadMatchingTargets(spec), loadGeneratorModelCatalog(), loadViewModelCatalog()
    ]);
    const pairIndex = buildCompatibleModulePairIndex(generators, views);
    const tuples = matchTargets(targets, generators, views, {pairIndex}).tuples;
    const generatorsById = new Map(generators.map(model => [model.generatorId, model]));
    const viewsById = new Map(views.map(model => [model.viewId, model]));
    const tuplesByKey = new Map(tuples.map(tuple => [tupleKey(tuple.target.id, tuple.generatorId, tuple.viewId), tuple]));
    const subjects: DependencyAuditSubject[] = [];
    const coverage: DependencyAuditCoverage[] = [];
    for (const tuple of tuples) {
        const ref = {targetId: tuple.target.id, generatorId: tuple.generatorId, viewId: tuple.viewId};
        try {
            const selections = enumerateDependencyAuditSelections(tuple.plan, limit);
            const annotationCoverage = {status: 'complete' as 'complete' | 'pending' | 'invalid', exhaustive: 0, pending: 0, invalid: 0};
            for (const selection of selections.selections) {
                const id = `selection:${tupleKey(ref.targetId, ref.generatorId, ref.viewId)}:${selection.variantHash}`;
                const annotation = resolveDependencyAuditAnnotation({id, plan: tuple.plan, selection,
                    generator: generatorsById.get(ref.generatorId), view: viewsById.get(ref.viewId)});
                const status = annotation.annotationResolution.status;
                if (status !== 'not_required') annotationCoverage[status]++;
                subjects.push({...ref, kind: 'selection', id, ...annotation,
                    planHash: tuple.plan.hash, variantHash: selection.variantHash});
            }
            annotationCoverage.status = annotationCoverage.invalid ? 'invalid' : annotationCoverage.pending ? 'pending' : 'complete';
            coverage.push({...ref, status: selections.status, total: selections.total, checked: selections.selections.length,
                annotationResolution: annotationCoverage,
                ...(selections.status === 'limit_exceeded' ? {reason: 'Complete admitted space exceeds the audit bound; no representative sample is reported as exhaustive.'} : {})});
        } catch (error) {
            coverage.push({...ref, status: 'invalid_plan', total: 'unknown', checked: 0, reason: errorMessage(error)});
        }
    }

    const snapshot = input.snapshot ?? readDatasetSnapshot(datasetDir);
    const samples = (['train', 'val'] as const).flatMap(split => snapshot.rows(split).map(row => ({row, split})));
    for (const {row, split} of samples) {
        const labels = Array.isArray(row.labels) && row.labels.every(label => typeof label === 'string')
            ? (row.labels as string[]).map(label => label.includes('://') ? label : `http://edugraph.io/edu/${label}`) : [];
        const issues = [...dependencyAuditRowIssues(row, split),
            ...(labels.length ? [] : ['Stored row has no valid annotation label list.'])];
        const resolved = dependencyAuditResolvedAreas(row);
        issues.push(...resolved.issues);
        for (const area of resolved.areas) {
            if (!labels.includes(area)) issues.push(`Stored annotations omit a resolved Area: ${area}.`);
        }
        if (row.spec !== spec) issues.push('Stored row belongs to a different spec.');
        const current = tuplesByKey.get(tupleKey(String(row.target_id), row.generator, row.view));
        const resolvedAreas = [...new Set([...resolved.areas, ...labels.filter(label => Object.values(Area).includes(label as Area))])].sort();
        subjects.push({kind: 'sample', id: `sample:${split}:${row.sample_key}`, targetId: String(row.target_id ?? ''),
            generatorId: row.generator, viewId: row.view, labels, resolvedAreas, planHash: current?.plan.hash,
            split, mode: String(row.mode ?? ''), fileName: row.file_name,
            targetAssociations: row.target_associations ?? [], issues});
    }
    const report = buildLabelDependencyAudit({spec, policyHash, ontology,
        dataset: {status: snapshot.generationId ? 'available' : 'unavailable', generationId: snapshot.generationId},
        selectionCoverage: coverage, subjects, evaluate: evaluator.evaluate});
    return report;
}
