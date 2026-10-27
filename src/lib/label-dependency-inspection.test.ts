import {beforeEach, describe, expect, it, vi} from 'vitest';
import {isAbsolute, resolve} from 'node:path';
import {Ability, Area, Scope} from 'edugraph-ts/generated';
import type {DatasetSnapshot} from './dataset-store.ts';
import {assessLabelDependencyEvidence} from './label-dependency-evidence.ts';
import {inspectLabelDependencies} from './label-dependency-inspection.ts';

const mocks = vi.hoisted(() => ({
    exists: vi.fn(), digest: vi.fn(), provenance: vi.fn(), snapshot: vi.fn(),
    targets: vi.fn(), generators: vi.fn(), views: vi.fn(), runtime: vi.fn(),
    pairIndex: vi.fn(), matches: vi.fn(), selections: vi.fn(),
    rowIssues: vi.fn(), resolvedAreas: vi.fn(), sourceIssues: vi.fn(), replay: vi.fn()
}));

vi.mock('node:fs', async original => ({...await original<typeof import('node:fs')>(), existsSync: mocks.exists}));
vi.mock('./content-identity.ts', async original => ({...await original<typeof import('./content-identity.ts')>(), digestFile: mocks.digest}));
vi.mock('./coverage-identity.ts', () => ({resolveOntologyProvenance: mocks.provenance}));
vi.mock('./dataset-store.ts', () => ({readDatasetSnapshot: mocks.snapshot}));
vi.mock('./spec-validator.ts', () => ({loadMatchingTargets: mocks.targets}));
vi.mock('./model-catalog.ts', () => ({loadGeneratorModelCatalog: mocks.generators, loadViewModelCatalog: mocks.views}));
vi.mock('./matching.ts', () => ({buildCompatibleModulePairIndex: mocks.pairIndex, matchTargets: mocks.matches}));
vi.mock('./generation.ts', () => ({loadGeneratorCatalog: mocks.runtime,
    computeContentFingerprint: vi.fn(), computeTaskFingerprint: vi.fn(), parseSampleKey: vi.fn()}));
vi.mock('./label-dependency-audit.ts', async original => ({
    ...await original<typeof import('./label-dependency-audit.ts')>(),
    enumerateDependencyAuditSelections: mocks.selections, dependencyAuditRowIssues: mocks.rowIssues,
    dependencyAuditResolvedAreas: mocks.resolvedAreas, dependencyAuditSourceIssues: mocks.sourceIssues,
    replayDependencyAuditRow: mocks.replay
}));

const projectRoot = resolve('temp/label-dependency-inspection-fixture');
const generatorId = 'arithmetic-ops-pairs', viewId = 'operations-boxes';
const labels = [Area.Addition, Ability.ProcedureExecution, Scope.IntegerNumbers, Scope.ArabicNumerals,
    Scope.Base10, Scope.NumbersWithoutZero, Scope.NumbersWithoutNegatives, Scope.TwoOperands];
const data = {operation: 'addition', num1: 6, num2: 2, answer: 8};
const runtimeGenerator = {generate: vi.fn(), schema: {}};
const plan = {hash: 'current-plan', identity: {targetId: 'target', generatorId, viewId}};
const tuple = {target: {id: 'target', labels: [Area.Addition]}, generatorId, viewId, plan};
const models = [{generatorId, module: {absolutePath: resolve(projectRoot, 'src/generators/arithmetic/arithmetic-ops-pairs')}},
    {generatorId: 'unused-generator', module: {absolutePath: resolve(projectRoot, 'src/generators/unused')}}];
const viewModels = [{viewId, schema: {notation: 'fixture-schema'}}];
const graph = Object.freeze({nodes: Object.freeze({}), complete: true});

function stored(extra: Record<string, unknown> = {}) {
    return {sample_key: 'target#arithmetic-ops-pairs#operations-boxes#train#question#inst:0',
        spec: 'fixture', target_id: 'target', generator: generatorId, view: viewId,
        mode: 'question', file_name: 'fixture.png', labels,
        target_associations: [{spec: 'fixture', target_id: 'alias'}], ...extra};
}

function snapshot(train: readonly unknown[] = [], val: readonly unknown[] = [], generationId: string | null = 'immutable-generation') {
    return {generationId, buildManifest: {dependency_graph: graph},
        rows: vi.fn((split: string) => split === 'train' ? train : val)} as unknown as DatasetSnapshot;
}

beforeEach(() => {
    vi.resetAllMocks();
    mocks.exists.mockReturnValue(true);
    mocks.digest.mockImplementation((path: string) => ({sha256: `digest:${path}`, bytes: 1}));
    mocks.provenance.mockReturnValue({version: 'fixture-ontology'});
    mocks.targets.mockResolvedValue([tuple.target]);
    mocks.generators.mockResolvedValue(models);
    mocks.views.mockResolvedValue(viewModels);
    mocks.pairIndex.mockReturnValue({fixture: true});
    mocks.matches.mockReturnValue({tuples: [tuple]});
    mocks.selections.mockReturnValue({status: 'complete', total: '1',
        selections: [{variantHash: 'selected-variant', labels, choices: []}]});
    mocks.snapshot.mockReturnValue(snapshot());
    mocks.runtime.mockResolvedValue([{generatorId, generator: runtimeGenerator}]);
    mocks.rowIssues.mockReturnValue([]);
    mocks.resolvedAreas.mockReturnValue({areas: [Area.Addition], issues: []});
    mocks.sourceIssues.mockReturnValue([]);
    mocks.replay.mockImplementation(({row}: {row: ReturnType<typeof stored>}) => ({status: 'verified', issues: [], evidence: assessLabelDependencyEvidence({
            generatorId: row.generator, viewId: row.view, mode: row.mode === 'solution' ? 'solution' : 'question', data})}));
});

describe('shared immutable dependency inspection', () => {
    it('checks annotations by default without loading or replaying a generator', async () => {
        const report = await inspectLabelDependencies({projectRoot, spec: 'fixture', snapshot: snapshot([
            stored({generator: 'unreviewed-generator', view: 'unreviewed-view',
                labels: labels.filter(label => label !== Scope.Base10)})
        ])});
        expect(mocks.runtime).not.toHaveBeenCalled();
        expect(mocks.replay).not.toHaveBeenCalled();
        expect(mocks.sourceIssues).not.toHaveBeenCalled();
        const sample = report.subjects.find(subject => subject.kind === 'sample')!;
        expect(sample.replay).toBe('not_requested');
        expect(sample.evaluation.assessments.find(item => item.facet === 'base')?.status).toBe('missing');
        expect(sample.evaluation.assessments.find(item => item.facet === 'operandDigits')?.status).toBe('missing');
        expect(sample.evaluation.evidenceAssessments).toEqual([]);
        expect(report.evidence_findings).toEqual([]);
    });

    it('keeps annotation findings identical when optional replay is unavailable', async () => {
        const supplied = snapshot([stored()]);
        const plain = await inspectLabelDependencies({projectRoot, spec: 'fixture', snapshot: supplied});
        mocks.replay.mockReturnValue({status: 'unresolved', issues: ['Stale evidence source.'],
            evidence: assessLabelDependencyEvidence({generatorId, viewId, mode: 'question'})});
        const diagnostic = await inspectLabelDependencies({projectRoot, spec: 'fixture', snapshot: supplied, includeEvidence: true});
        expect(diagnostic.findings).toEqual(plain.findings);
        expect(diagnostic.summary.assessments).toEqual(plain.summary.assessments);
        expect(diagnostic.subjects.find(subject => subject.kind === 'sample')?.issues).toEqual([]);
        expect(diagnostic.subjects.find(subject => subject.kind === 'sample')?.evidenceIssues).toEqual(['Stale evidence source.']);
    });

    it('uses the supplied snapshot for rows and source identities and retains complete assessment findings', async () => {
        const row = Object.freeze(stored());
        const supplied = snapshot(Object.freeze([row]));
        mocks.snapshot.mockImplementation(() => {throw new Error('Must not reopen a supplied generation.');});
        const report = await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', snapshot: supplied});

        expect(mocks.snapshot).not.toHaveBeenCalled();
        expect(supplied.rows).toHaveBeenCalledTimes(2);
        expect(supplied.rows).toHaveBeenNthCalledWith(1, 'train');
        expect(supplied.rows).toHaveBeenNthCalledWith(2, 'val');
        expect(report.dataset).toEqual({status: 'available', generationId: 'immutable-generation'});
        expect(mocks.sourceIssues.mock.calls[0][0].graph).toBe(graph);
        expect(mocks.replay).toHaveBeenCalledWith({row, currentPlan: plan, generator: runtimeGenerator,
            viewSchema: viewModels[0].schema, sourceIssues: []});
        expect(report.summary).toMatchObject({selections: 1, samples: 1, replay: {verified: 1, unsupported: 0, unresolved: 0}});
        const sample = report.subjects.find(subject => subject.kind === 'sample')!;
        expect(sample.targetAssociations).toEqual(row.target_associations);
        expect(sample.labels).toEqual([...labels].sort());
        expect(sample.evaluation.evidenceAssessments?.find(assessment => assessment.facet === 'operandDigits')).toMatchObject({
            status: 'missing', missingLabels: [Scope.SingleDigitLargestOperand, Scope.SingleDigitSmallestOperand]
        });
        expect(report.findings.some(finding => finding.kind === 'sample' && finding.facet === 'operandDigits')).toBe(true);
        expect(row.labels).toBe(labels);
    });

    it('opens a missing generated dataset once and avoids loading runtime implementations without supported rows', async () => {
        mocks.matches.mockReturnValue({tuples: []});
        const absent = snapshot([], [], null);
        mocks.snapshot.mockReturnValueOnce(absent).mockImplementation(() => {throw new Error('Second generation opened.');});
        const report = await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture'});
        expect(mocks.snapshot).toHaveBeenCalledOnce();
        expect(mocks.snapshot).toHaveBeenCalledWith(resolve(projectRoot, 'out/dataset-fixture'));
        expect(mocks.runtime).not.toHaveBeenCalled();
        expect(report.dataset).toEqual({status: 'unavailable', generationId: null});
        expect(report.summary).toMatchObject({selections: 0, samples: 0, incomplete_tuples: 0});
    });

    it('loads only runtime producers needed by supported stored projections', async () => {
        const unsupported = stored({generator: 'unreviewed-generator', view: 'unreviewed-view', sample_key: 'unsupported'});
        const supplied = snapshot([stored(), unsupported], [stored({mode: 'solution', sample_key: 'solution'})]);
        const report = await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', snapshot: supplied});
        const sourceMap = mocks.runtime.mock.calls[0][2] as Map<string, string>;
        expect([...sourceMap]).toEqual([[generatorId, resolve(models[0].module.absolutePath, 'spec.ts')]]);
        expect(mocks.runtime).toHaveBeenCalledOnce();
        expect(mocks.replay).toHaveBeenCalledTimes(2);
        expect(mocks.sourceIssues).toHaveBeenCalledOnce();
        expect(report.summary.replay).toEqual({verified: 2, unresolved: 0, unsupported: 1, not_requested: 0});
        const unreviewed = report.subjects.find(subject => subject.generatorId === 'unreviewed-generator')!;
        expect(unreviewed.replay).toBe('unsupported');
        expect(unreviewed.evidence.adapter).toBe('uncovered');
        expect(report.subjects.find(subject => subject.id === 'sample:val:solution')?.mode).toBe('solution');
    });

    it('keeps unsupported-only rows visible without importing a runtime generator', async () => {
        mocks.matches.mockReturnValue({tuples: []});
        await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', snapshot: snapshot([
            stored({generator: 'unreviewed-generator', view: 'unreviewed-view'})])});
        expect(mocks.runtime).not.toHaveBeenCalled();
        expect(mocks.replay).not.toHaveBeenCalled();
        expect(mocks.sourceIssues).not.toHaveBeenCalled();
    });
});

describe('selection completeness and shared inspection input validation', () => {
    it('passes complete model catalogs and pair index into matching and preserves each selection', async () => {
        mocks.selections.mockReturnValue({status: 'complete', total: '2', selections: [
            {variantHash: 'first', labels, choices: []},
            {variantHash: 'second', labels: [...labels, Scope.NumbersSmaller20], choices: []}
        ]});
        const report = await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', maxSelections: 2});
        expect(mocks.targets).toHaveBeenCalledWith('fixture');
        expect(mocks.pairIndex).toHaveBeenCalledWith(models, viewModels);
        expect(mocks.matches).toHaveBeenCalledWith([tuple.target], models, viewModels, {pairIndex: {fixture: true}});
        expect(mocks.selections).toHaveBeenCalledWith(plan, 2);
        expect(report.selection_coverage).toEqual([{targetId: 'target', generatorId, viewId,
            status: 'complete', total: '2', checked: 2}]);
        expect(report.subjects.map(subject => subject.variantHash)).toEqual(['first', 'second']);
        expect(report.subjects.every(subject => subject.planHash === plan.hash)).toBe(true);
    });

    it('reports a bounded-out selection space without treating an empty inspection as complete', async () => {
        mocks.selections.mockReturnValue({status: 'limit_exceeded', total: '4097', selections: []});
        const report = await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', maxSelections: 4096});
        expect(report.summary.incomplete_tuples).toBe(1);
        expect(report.summary.selections).toBe(0);
        expect(report.selection_coverage[0]).toMatchObject({status: 'limit_exceeded', total: '4097', checked: 0,
            reason: expect.stringContaining('no representative sample')});
    });

    it.each([new Error('Invalid matching plan.'), 'Invalid matching plan.'])(
        'preserves thrown selection contract failures in the report', async error => {
            mocks.selections.mockImplementation(() => {throw error;});
            const report = await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture'});
            expect(report.selection_coverage[0]).toMatchObject({status: 'invalid_plan', total: 'unknown', checked: 0,
                reason: 'Invalid matching plan.'});
            expect(report.summary.incomplete_tuples).toBe(1);
        });

    it.each([0, -1, 1.5, 4097, Number.NaN, Infinity])('rejects invalid limits even for an empty standard: %s', async maxSelections => {
        mocks.matches.mockReturnValue({tuples: []});
        await expect(inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', maxSelections})).rejects.toThrow('Selection limit');
        expect(mocks.targets).not.toHaveBeenCalled();
        expect(mocks.snapshot).not.toHaveBeenCalled();
    });

    it.each([1, 4096])('accepts the valid bound %i', async maxSelections => {
        await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', maxSelections});
        expect(mocks.selections).toHaveBeenCalledWith(plan, maxSelections);
    });
});

describe('stored annotation and evidence provenance', () => {
    it.each([undefined, [], 'Addition', [Area.Addition, 42]])('retains invalid annotation and provenance diagnostics: %j', async invalidLabels => {
        mocks.rowIssues.mockReturnValue(['Stored mode disagrees.']);
        mocks.resolvedAreas.mockReturnValue({areas: [Area.Addition], issues: ['Replay recipe invalid.']});
        const row = stored({labels: invalidLabels, spec: 'other', target_id: undefined, mode: undefined});
        const report = await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', snapshot: snapshot([row])});
        const sample = report.subjects.find(subject => subject.kind === 'sample')!;
        expect(sample.labels).toEqual([]);
        expect(sample.targetId).toBe('');
        expect(sample.mode).toBe('');
        expect(sample.planHash).toBeUndefined();
        expect(sample.issues).toEqual(expect.arrayContaining([
            'Stored mode disagrees.', 'Replay recipe invalid.', 'Stored row has no valid annotation label list.',
            `Stored annotations omit a resolved Area: ${Area.Addition}.`, 'Stored row belongs to a different spec.'
        ]));
        expect(report.summary.row_issues).toBe(5);
    });

    it('normalizes short labels and retains already absolute labels without changing source rows', async () => {
        const row = stored({labels: ['Addition', Ability.ProcedureExecution, 'IntegerNumbers'], target_associations: undefined});
        const report = await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', snapshot: snapshot([row])});
        const sample = report.subjects.find(subject => subject.kind === 'sample')!;
        expect(sample.labels).toEqual([Area.Addition, Ability.ProcedureExecution, Scope.IntegerNumbers].sort());
        expect(sample.issues).toEqual([]);
        expect(sample.targetAssociations).toEqual([]);
        expect(row.labels).toEqual(['Addition', Ability.ProcedureExecution, 'IntegerNumbers']);
    });

    it('passes missing plan, producer, and view implementations into explicit unresolved replay diagnostics', async () => {
        mocks.runtime.mockResolvedValue([]);
        mocks.views.mockResolvedValue([]);
        mocks.replay.mockReturnValue({status: 'unresolved', issues: ['Current implementation unavailable.'], evidence: assessLabelDependencyEvidence({generatorId, viewId, mode: 'question'})});
        const row = stored({target_id: 'deleted-target'});
        const report = await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', snapshot: snapshot([row])});
        expect(mocks.replay).toHaveBeenCalledWith({row, currentPlan: undefined, generator: undefined,
            viewSchema: undefined, sourceIssues: []});
        const sample = report.subjects.find(subject => subject.kind === 'sample')!;
        expect(sample.replay).toBe('unresolved');
        expect(sample.evidenceIssues).toEqual(['Current implementation unavailable.']);
        expect(report.summary.replay.unresolved).toBe(1);
    });

    it('retains missing snapshot-manifest provenance failures without switching to another generation', async () => {
        const supplied = {...snapshot([stored()]), buildManifest: null} as unknown as DatasetSnapshot;
        mocks.sourceIssues.mockReturnValue(['No stored source identity.']);
        mocks.replay.mockImplementation(({sourceIssues}: {sourceIssues: string[]}) => ({status: 'unresolved',
            issues: sourceIssues, evidence: assessLabelDependencyEvidence({
                generatorId, viewId, mode: 'question'})}));
        const report = await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', snapshot: supplied});
        expect(mocks.snapshot).not.toHaveBeenCalled();
        expect(mocks.sourceIssues.mock.calls[0][0].graph).toBeUndefined();
        expect(report.summary).toMatchObject({evidence_issues: 1, replay: {unresolved: 1}});
        expect(report.subjects.find(subject => subject.kind === 'sample')?.evidenceIssues).toEqual(['No stored source identity.']);
    });

    it('retains evaluator contract errors instead of converting malformed evidence into a passing report', async () => {
        const evidence = assessLabelDependencyEvidence({generatorId, viewId, mode: 'question', data});
        mocks.replay.mockReturnValue({status: 'verified', issues: [],
            evidence: {...evidence, facets: {...evidence.facets,
                zero: {...evidence.facets.zero, expectedLabels: [Scope.Base10]}}}});
        const report = await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', snapshot: snapshot([stored()])});
        const sample = report.subjects.find(subject => subject.kind === 'sample')!;
        expect(report.summary.evidence_contract_errors).toBeGreaterThan(0);
        expect(sample.evaluation.evidenceErrors).toEqual(expect.arrayContaining([expect.stringContaining('LD-NUM-01/zero')]));
        expect(sample.evaluation.evidenceAssessments?.find(assessment => assessment.facet === 'zero')?.status).toBe('unresolved');
    });

    it('checks source content once per file and pair and never reads escaped or missing paths', async () => {
        const known = 'src/fixture.ts', missing = 'src/missing.ts', outside = '../escape.ts';
        const otherDrive = process.platform === 'win32' ? `${projectRoot.startsWith('Z:') ? 'Y' : 'Z'}:/escape.ts` : outside;
        mocks.exists.mockImplementation((path: string) => path !== resolve(projectRoot, missing));
        mocks.sourceIssues.mockImplementation(({sourceHash}: {sourceHash: (path: string) => string | undefined}) => {
            expect(sourceHash(known)).toBe(`digest:${resolve(projectRoot, known)}`);
            expect(sourceHash(known)).toBe(`digest:${resolve(projectRoot, known)}`);
            expect(sourceHash(missing)).toBeUndefined();
            expect(sourceHash(missing)).toBeUndefined();
            expect(sourceHash(outside)).toBeUndefined();
            if (isAbsolute(otherDrive)) expect(sourceHash(otherDrive)).toBeUndefined();
            return ['View source is stale.'];
        });
        const supplied = snapshot([stored(), stored({sample_key: 'second'})]);
        const report = await inspectLabelDependencies({projectRoot, includeEvidence: true, spec: 'fixture', snapshot: supplied});
        expect(mocks.sourceIssues).toHaveBeenCalledOnce();
        expect(mocks.digest.mock.calls.filter(([path]) => path === resolve(projectRoot, known))).toHaveLength(1);
        expect(mocks.digest.mock.calls.some(([path]) => [resolve(projectRoot, outside), resolve(projectRoot, missing), otherDrive].includes(path))).toBe(false);
        expect(mocks.replay.mock.calls.every(([input]) => input.sourceIssues[0] === 'View source is stale.')).toBe(true);
        expect(report.dataset.generationId).toBe('immutable-generation');
    });

    it('versions deterministic reports by effective machinery and ontology inputs', async () => {
        const supplied = snapshot([stored()]);
        const input = {projectRoot, includeEvidence: true, spec: 'fixture', snapshot: supplied};
        const original = await inspectLabelDependencies(input);
        expect(await inspectLabelDependencies(input)).toEqual(original);
        mocks.digest.mockImplementation((path: string) => ({sha256: `changed:${path}`, bytes: 1}));
        const changedMachinery = await inspectLabelDependencies(input);
        expect(changedMachinery.policy_hash).not.toBe(original.policy_hash);
        expect(changedMachinery.subjects).toEqual(original.subjects);
        mocks.provenance.mockReturnValue({version: 'new-ontology'});
        expect((await inspectLabelDependencies(input)).policy_hash).not.toBe(changedMachinery.policy_hash);
    });
});
