import {mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {dirname, isAbsolute, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getCliOption} from '../lib/cli.ts';
import {digestFile, digestIdentity} from '../lib/content-identity.ts';
import {resolveOntologyProvenance} from '../lib/coverage-identity.ts';
import {datasetDirForSpec, datasetOutDir} from '../lib/dataset-paths.ts';
import type {DatasetManifest} from '../lib/dataset-manifest.ts';
import {readDatasetSnapshot} from '../lib/dataset-store.ts';
import {loadGeneratorCatalog, type SampleSplit} from '../lib/generation.ts';
import {buildCompatibleModulePairIndex, matchTargets} from '../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../lib/model-catalog.ts';
import {loadMatchingTargets} from '../lib/spec-validator.ts';
import {createLabelDependencyEvaluator} from '../lib/label-dependencies.ts';
import {assessLabelDependencyEvidence, hasLabelDependencyEvidenceAdapter} from '../lib/label-dependency-evidence.ts';
import {buildLabelDependencyAudit, dependencyAuditResolvedAreas, dependencyAuditRowIssues, dependencyAuditSourceIssues, enumerateDependencyAuditSelections,
    formatLabelDependencyAudit, replayDependencyAuditRow,
    type DependencyAuditCoverage, type DependencyAuditSubject} from '../lib/label-dependency-audit.ts';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);
const tupleKey = (target: string, generator: string, view: string) => JSON.stringify([target, generator, view]);

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    for (const arg of args) {
        if (!/^--(?:spec|output-dir|max-selections)=.+$/.test(arg)) throw new Error(`Unsupported report-only audit option: ${arg}`);
    }
    const spec = getCliOption(args, 'spec');
    if (!spec || !/^[a-zA-Z0-9_-]+$/.test(spec)) {
        throw new Error('Usage: npm run audit:label-dependencies -- --spec=<module> [--max-selections=4096] [--output-dir=temp/…]');
    }
    const datasetDir = datasetOutDir(PROJECT_ROOT, datasetDirForSpec(spec));
    const outputDir = resolve(PROJECT_ROOT, getCliOption(args, 'output-dir') ?? `temp/label-dependencies/${spec}`);
    const outputRelative = relative(resolve(PROJECT_ROOT, 'temp'), outputDir);
    if (!outputRelative || outputRelative.startsWith('..') || isAbsolute(outputRelative)) {
        throw new Error('Audit reports must be written to a subdirectory of temp/.');
    }
    const limitArg = getCliOption(args, 'max-selections');
    const limit = limitArg === undefined ? undefined : Number(limitArg);
    // Validate even when a selected standard has no matching tuples.
    if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1 || limit > 4096)) {
        throw new Error('--max-selections must be an integer between 1 and 4096.');
    }
    const evaluator = createLabelDependencyEvaluator();
    const ontology = resolveOntologyProvenance(PROJECT_ROOT);
    const sources = ['src/types/label-dependencies.ts', 'src/validation/label-dependencies.ts',
        'src/lib/label-dependencies.ts', 'src/lib/label-dependency-evidence.ts',
        'src/lib/label-dependency-audit.ts', 'src/scripts/audit-label-dependencies.ts'];
    const policyHash = digestIdentity({evaluator: evaluator.policyHash, ontology,
        implementation: sources.map(path => ({path, ...digestFile(resolve(PROJECT_ROOT, path))}))});
    const [targets, generators, views] = await Promise.all([
        loadMatchingTargets(spec), loadGeneratorModelCatalog(), loadViewModelCatalog()
    ]);
    const pairIndex = buildCompatibleModulePairIndex(generators, views);
    const tuples = matchTargets(targets, generators, views, {pairIndex}).tuples;
    const tuplesByKey = new Map(tuples.map(tuple => [tupleKey(tuple.target.id, tuple.generatorId, tuple.viewId), tuple]));
    const subjects: DependencyAuditSubject[] = [];
    const coverage: DependencyAuditCoverage[] = [];
    for (const tuple of tuples) {
        const ref = {targetId: tuple.target.id, generatorId: tuple.generatorId, viewId: tuple.viewId};
        try {
            const selections = enumerateDependencyAuditSelections(tuple.plan, limit);
            coverage.push({...ref, status: selections.status, total: selections.total, checked: selections.selections.length,
                ...(selections.status === 'limit_exceeded' ? {reason: 'Complete admitted space exceeds the audit bound; no representative sample is reported as exhaustive.'} : {})});
            for (const selection of selections.selections) subjects.push({...ref, kind: 'selection',
                id: `selection:${tupleKey(ref.targetId, ref.generatorId, ref.viewId)}:${selection.variantHash}`,
                labels: selection.labels, planHash: tuple.plan.hash, variantHash: selection.variantHash,
                evidence: assessLabelDependencyEvidence({...ref, mode: 'question'})});
        } catch (error) {
            coverage.push({...ref, status: 'invalid_plan', total: 'unknown', checked: 0, reason: errorMessage(error)});
        }
    }

    const snapshot = readDatasetSnapshot(datasetDir);
    // Keep rows and their source graph bound to this single immutable generation.
    const manifest = snapshot.buildManifest as DatasetManifest | null;
    const samples = (['train', 'val'] as SampleSplit[]).flatMap(split => snapshot.rows(split).map(row => ({row, split})));
    const neededGenerators = new Set(samples.filter(({row}) => hasLabelDependencyEvidenceAdapter(row.generator, row.view))
        .map(({row}) => row.generator));
    const runtime = neededGenerators.size ? await loadGeneratorCatalog(undefined, undefined,
        new Map(generators.filter(generator => neededGenerators.has(generator.generatorId))
            .map(generator => [generator.generatorId, resolve(generator.module.absolutePath, 'spec.ts')]))) : [];
    const runtimeById = new Map(runtime.map(entry => [entry.generatorId, entry.generator]));
    const viewsById = new Map(views.map(view => [view.viewId, view]));
    const sourceHashes = new Map<string, string | undefined>();
    const sourceHash = (path: string): string | undefined => {
        if (sourceHashes.has(path)) return sourceHashes.get(path);
        const absolute = resolve(PROJECT_ROOT, path);
        const local = relative(PROJECT_ROOT, absolute);
        const hash = local.startsWith('..') || isAbsolute(local) || !existsSync(absolute)
            ? undefined : digestFile(absolute).sha256;
        sourceHashes.set(path, hash);
        return hash;
    };
    const issuesByPair = new Map<string, string[]>();
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
        let evidence = assessLabelDependencyEvidence({generatorId: row.generator, viewId: row.view,
            mode: row.mode === 'solution' ? 'solution' : 'question'});
        let replay: DependencyAuditSubject['replay'] = 'unsupported';
        const current = tuplesByKey.get(tupleKey(String(row.target_id), row.generator, row.view));
        if (hasLabelDependencyEvidenceAdapter(row.generator, row.view)) {
            const key = JSON.stringify([row.generator, row.view]);
            let sourceIssues = issuesByPair.get(key);
            if (!sourceIssues) {
                sourceIssues = dependencyAuditSourceIssues({graph: manifest?.dependency_graph,
                    generatorId: row.generator, viewId: row.view, sourceHash});
                issuesByPair.set(key, sourceIssues);
            }
            const result = replayDependencyAuditRow({row, currentPlan: current?.plan,
                generator: runtimeById.get(row.generator), viewSchema: viewsById.get(row.view)?.schema, sourceIssues});
            evidence = result.evidence;
            replay = result.status;
            issues.push(...result.issues);
        }
        subjects.push({kind: 'sample', id: `sample:${split}:${row.sample_key}`, targetId: String(row.target_id ?? ''),
            generatorId: row.generator, viewId: row.view, labels, resolvedAreas: resolved.areas, planHash: current?.plan.hash,
            split, mode: String(row.mode ?? ''), fileName: row.file_name,
            targetAssociations: row.target_associations ?? [], evidence, replay, issues});
    }
    const report = buildLabelDependencyAudit({spec, policyHash, ontology,
        dataset: {status: snapshot.generationId ? 'available' : 'unavailable', generationId: snapshot.generationId},
        selectionCoverage: coverage, subjects, evaluate: evaluator.evaluate});
    mkdirSync(outputDir, {recursive: true});
    writeFileSync(resolve(outputDir, 'audit.json'), `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(resolve(outputDir, 'audit.md'), formatLabelDependencyAudit(report));
    console.log('=== Label Dependency Audit (report only) ===');
    console.log(`Spec: ${spec}; selections: ${report.summary.selections}; samples: ${report.summary.samples}`);
    console.log(`Missing: ${report.summary.assessments.missing}; unresolved: ${report.summary.assessments.unresolved}; incomplete tuples: ${report.summary.incomplete_tuples}`);
    console.log(`JSON: ${resolve(outputDir, 'audit.json')}`);
    console.log(`Markdown: ${resolve(outputDir, 'audit.md')}`);
}

main().catch(error => {
    console.error(errorMessage(error));
    process.exitCode = 1;
});
