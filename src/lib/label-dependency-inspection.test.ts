import {beforeEach, describe, expect, it, vi} from 'vitest';
import {resolve} from 'node:path';
import {Ability, Area, Scope} from 'edugraph-ts/generated';
import type {DatasetSnapshot} from './dataset-store.ts';
import {inspectLabelDependencies} from './label-dependency-inspection.ts';

const mocks = vi.hoisted(() => ({digest: vi.fn(), provenance: vi.fn(), snapshot: vi.fn(), targets: vi.fn(),
    generators: vi.fn(), views: vi.fn(), runtime: vi.fn(), pairIndex: vi.fn(), matches: vi.fn(),
    selections: vi.fn(), rowIssues: vi.fn(), resolvedAreas: vi.fn()}));
vi.mock('./content-identity.ts', async original => ({...await original<typeof import('./content-identity.ts')>(), digestFile: mocks.digest}));
vi.mock('./coverage-identity.ts', () => ({resolveOntologyProvenance: mocks.provenance}));
vi.mock('./dataset-store.ts', () => ({readDatasetSnapshot: mocks.snapshot}));
vi.mock('./spec-validator.ts', () => ({loadMatchingTargets: mocks.targets}));
vi.mock('./model-catalog.ts', () => ({loadGeneratorModelCatalog: mocks.generators, loadViewModelCatalog: mocks.views}));
vi.mock('./matching.ts', () => ({buildCompatibleModulePairIndex: mocks.pairIndex, matchTargets: mocks.matches}));
vi.mock('./generation.ts', () => ({loadGeneratorCatalog: mocks.runtime, computeSampleSeed: vi.fn(), parseSampleKey: vi.fn()}));
vi.mock('./label-dependency-audit.ts', async original => ({
    ...await original<typeof import('./label-dependency-audit.ts')>(),
    enumerateDependencyAuditSelections: mocks.selections, dependencyAuditRowIssues: mocks.rowIssues,
    dependencyAuditResolvedAreas: mocks.resolvedAreas
}));

const projectRoot = resolve('temp/label-dependency-inspection-fixture');
const generatorId = 'arithmetic-ops-pairs', viewId = 'operations-boxes';
const labels = [Area.Addition, Ability.ProcedureExecution, Scope.IntegerNumbers, Scope.ArabicNumerals,
    Scope.Base10, Scope.NumbersWithoutZero, Scope.NumbersWithoutNegatives, Scope.TwoOperands];
const plan = {hash: 'current-plan', identity: {targetId: 'target', generatorId, viewId}};
const tuple = {target: {id: 'target', labels: [Area.Addition]}, generatorId, viewId, plan};
const models = [{generatorId, module: {absolutePath: resolve(projectRoot, 'src/generators/arithmetic/arithmetic-ops-pairs')}}];
const viewModels = [{viewId, schema: {notation: 'fixture-schema'}}];
function stored(extra: Record<string, unknown> = {}) {
    return {sample_key: 'target#arithmetic-ops-pairs#operations-boxes#train#question#inst:0',
        spec: 'fixture', target_id: 'target', generator: generatorId, view: viewId,
        mode: 'question', file_name: 'fixture.png', labels,
        target_associations: [{spec: 'fixture', target_id: 'alias'}], ...extra};
}
function snapshot(train: readonly unknown[] = [], val: readonly unknown[] = [], generationId: string | null = 'immutable-generation') {
    return {generationId, buildManifest: null, rows: vi.fn((split: string) => split === 'train' ? train : val)} as unknown as DatasetSnapshot;
}
beforeEach(() => {
    vi.resetAllMocks();
    mocks.digest.mockImplementation((path: string) => ({sha256: `digest:${path}`, bytes: 1}));
    mocks.provenance.mockReturnValue({version: 'fixture-ontology'});
    mocks.targets.mockResolvedValue([tuple.target]); mocks.generators.mockResolvedValue(models); mocks.views.mockResolvedValue(viewModels);
    mocks.pairIndex.mockReturnValue({fixture: true}); mocks.matches.mockReturnValue({tuples: [tuple]});
    mocks.selections.mockReturnValue({status: 'complete', total: '1', selections: [{variantHash: 'selected-variant', labels, choices: []}]});
    mocks.snapshot.mockReturnValue(snapshot()); mocks.rowIssues.mockReturnValue([]);
    mocks.resolvedAreas.mockReturnValue({areas: [Area.Addition], issues: []});
    mocks.runtime.mockImplementation(() => {throw new Error('Generator execution is outside annotation inspection.');});
});

describe('immutable annotation inspection', () => {
    it('uses exactly the supplied snapshot and preserves complete stored labels/provenance', async () => {
        const row = Object.freeze(stored());
        const supplied = snapshot(Object.freeze([row]));
        mocks.snapshot.mockImplementation(() => {throw new Error('Must not reopen a supplied generation.');});
        const report = await inspectLabelDependencies({projectRoot, spec: 'fixture', snapshot: supplied});
        expect(mocks.snapshot).not.toHaveBeenCalled();
        expect(supplied.rows).toHaveBeenCalledTimes(2);
        expect(supplied.rows).toHaveBeenNthCalledWith(1, 'train');
        expect(supplied.rows).toHaveBeenNthCalledWith(2, 'val');
        expect(mocks.runtime).not.toHaveBeenCalled();
        expect(report.dataset).toEqual({status: 'available', generationId: 'immutable-generation'});
        const sample = report.subjects.find(subject => subject.kind === 'sample')!;
        expect(sample.targetAssociations).toEqual(row.target_associations);
        expect(sample.labels).toEqual([...labels].sort());
        expect(sample.evaluation.assessments.find(item => item.facet === 'operandDigits')?.status).toBe('missing');
        expect(report.findings.some(finding => finding.kind === 'sample' && finding.facet === 'operandDigits')).toBe(true);
        expect(row.labels).toBe(labels);
        expect(sample).not.toHaveProperty('evidence'); expect(sample).not.toHaveProperty('replay');
    });
    it('checks every producer/view and both splits without a runtime generator', async () => {
        const positionalLabels = [...labels.filter(label => label !== Scope.Base10), Scope.BaseTenBlocks];
        const supplied = snapshot([stored(), stored({generator: 'new-generator', view: 'new-view', sample_key: 'new', labels: positionalLabels})],
            [stored({mode: 'solution', sample_key: 'solution'})]);
        const report = await inspectLabelDependencies({projectRoot, spec: 'fixture', snapshot: supplied});
        expect(mocks.runtime).not.toHaveBeenCalled();
        expect(report.summary.samples).toBe(3);
        expect(report.subjects.find(subject => subject.generatorId === 'new-generator')?.evaluation.assessments
            .find(item => item.facet === 'base')).toMatchObject({ruleId: 'LD-POSITIONAL-01', status: 'missing'});
        expect(report.subjects.find(subject => subject.id === 'sample:val:solution')?.mode).toBe('solution');
    });
    it('opens a missing snapshot once without importing runtime implementations', async () => {
        mocks.matches.mockReturnValue({tuples: []}); mocks.snapshot.mockReturnValue(snapshot([], [], null));
        const report = await inspectLabelDependencies({projectRoot, spec: 'fixture'});
        expect(mocks.snapshot).toHaveBeenCalledOnce();
        expect(mocks.snapshot).toHaveBeenCalledWith(resolve(projectRoot, 'out/dataset-fixture'));
        expect(mocks.runtime).not.toHaveBeenCalled();
        expect(report.dataset).toEqual({status: 'unavailable', generationId: null});
        expect(report.summary).toMatchObject({selections: 0, samples: 0, incomplete_tuples: 0});
    });
});

describe('complete admitted selections', () => {
    it('passes complete catalogs/index into matching and retains each selected conjunction', async () => {
        mocks.selections.mockReturnValue({status: 'complete', total: '2', selections: [
            {variantHash: 'first', labels, choices: []}, {variantHash: 'second', labels: [...labels, Scope.NumbersSmaller20], choices: []}
        ]});
        const report = await inspectLabelDependencies({projectRoot, spec: 'fixture', maxSelections: 2});
        expect(mocks.targets).toHaveBeenCalledWith('fixture');
        expect(mocks.pairIndex).toHaveBeenCalledWith(models, viewModels);
        expect(mocks.matches).toHaveBeenCalledWith([tuple.target], models, viewModels, {pairIndex: {fixture: true}});
        expect(mocks.selections).toHaveBeenCalledWith(plan, 2);
        expect(report.selection_coverage).toEqual([{targetId: 'target', generatorId, viewId, status: 'complete', total: '2', checked: 2,
            annotationResolution: {status: 'complete', exhaustive: 0, pending: 0, invalid: 0}}]);
        expect(report.subjects.map(subject => subject.variantHash)).toEqual(['first', 'second']);
        expect(report.subjects.every(subject => subject.planHash === plan.hash)).toBe(true);
    });
    it('marks bounded-out spaces as incomplete without a representative sample', async () => {
        mocks.selections.mockReturnValue({status: 'limit_exceeded', total: '4097', selections: []});
        const report = await inspectLabelDependencies({projectRoot, spec: 'fixture', maxSelections: 4096});
        expect(report.summary).toMatchObject({incomplete_tuples: 1, selections: 0});
        expect(report.selection_coverage[0]).toMatchObject({status: 'limit_exceeded', total: '4097', checked: 0, reason: expect.stringContaining('no representative sample')});
    });
    it.each([new Error('Invalid matching plan.'), 'Invalid matching plan.'])('retains thrown selection contract failures', async error => {
        mocks.selections.mockImplementation(() => {throw error;});
        const report = await inspectLabelDependencies({projectRoot, spec: 'fixture'});
        expect(report.selection_coverage[0]).toMatchObject({status: 'invalid_plan', total: 'unknown', checked: 0, reason: 'Invalid matching plan.'});
        expect(report.summary.incomplete_tuples).toBe(1);
    });
    it.each([0, -1, 1.5, 4097, Number.NaN, Infinity])('rejects invalid limit %s before catalog loading', async maxSelections => {
        await expect(inspectLabelDependencies({projectRoot, spec: 'fixture', maxSelections})).rejects.toThrow('Selection limit');
        expect(mocks.targets).not.toHaveBeenCalled(); expect(mocks.snapshot).not.toHaveBeenCalled();
    });
    it.each([1, 4096])('accepts valid bound %i', async maxSelections => {
        await inspectLabelDependencies({projectRoot, spec: 'fixture', maxSelections});
        expect(mocks.selections).toHaveBeenCalledWith(plan, maxSelections);
    });
});

describe('stored annotation integrity and policy identity', () => {
    it.each([undefined, [], 'Addition', [Area.Addition, 42]])('retains invalid annotation and metadata diagnostics: %j', async invalidLabels => {
        mocks.rowIssues.mockReturnValue(['Stored mode disagrees.']);
        mocks.resolvedAreas.mockReturnValue({areas: [Area.Addition], issues: ['Recorded selection invalid.']});
        const report = await inspectLabelDependencies({projectRoot, spec: 'fixture', snapshot: snapshot([
            stored({labels: invalidLabels, spec: 'other', target_id: undefined, mode: undefined})])});
        const sample = report.subjects.find(subject => subject.kind === 'sample')!;
        expect(sample.labels).toEqual([]); expect(sample.targetId).toBe(''); expect(sample.mode).toBe(''); expect(sample.planHash).toBeUndefined();
        expect(sample.issues).toEqual(expect.arrayContaining(['Stored mode disagrees.', 'Recorded selection invalid.',
            'Stored row has no valid annotation label list.', `Stored annotations omit a resolved Area: ${Area.Addition}.`, 'Stored row belongs to a different spec.']));
        expect(report.summary.row_issues).toBe(5);
    });
    it('normalizes short labels without changing source rows', async () => {
        const row = stored({labels: ['Addition', Ability.ProcedureExecution, 'IntegerNumbers'], target_associations: undefined});
        const report = await inspectLabelDependencies({projectRoot, spec: 'fixture', snapshot: snapshot([row])});
        const sample = report.subjects.find(subject => subject.kind === 'sample')!;
        expect(sample.labels).toEqual([Area.Addition, Ability.ProcedureExecution, Scope.IntegerNumbers].sort());
        expect(sample.issues).toEqual([]); expect(sample.targetAssociations).toEqual([]);
        expect(row.labels).toEqual(['Addition', Ability.ProcedureExecution, 'IntegerNumbers']);
    });
    it('uses authoritative recorded Areas so omitting an outside Area cannot widen scope', async () => {
        mocks.resolvedAreas.mockReturnValue({areas: [Area.Addition, Area.EquationSolving], issues: []});
        const report = await inspectLabelDependencies({projectRoot, spec: 'fixture', snapshot: snapshot([stored()])});
        const sample = report.subjects.find(subject => subject.kind === 'sample')!;
        expect(sample.evaluation.context.status).toBe('outside_policy_scope');
        expect(sample.issues).toEqual([`Stored annotations omit a resolved Area: ${Area.EquationSolving}.`]);
    });
    it('includes an actual inferred outside Area in the complete context without requiring it in the matching plan', async () => {
        const row = stored({labels: [...labels, Area.EquationSolving]});
        const report = await inspectLabelDependencies({projectRoot, spec: 'fixture', snapshot: snapshot([row])});
        const sample = report.subjects.find(subject => subject.kind === 'sample')!;
        expect(sample.resolvedAreas).toEqual([Area.Addition, Area.EquationSolving].sort());
        expect(sample.evaluation.context.status).toBe('outside_policy_scope');
        expect(sample.issues).toEqual([]);
        expect(row.labels).toEqual([...labels, Area.EquationSolving]);
    });
    it('retains missing planned Area errors when another actual inferred Area is present', async () => {
        const actual = labels.filter(label => label !== Area.Addition).concat(Area.Subtraction);
        const report = await inspectLabelDependencies({projectRoot, spec: 'fixture', snapshot: snapshot([stored({labels: actual})])});
        const sample = report.subjects.find(subject => subject.kind === 'sample')!;
        expect(sample.resolvedAreas).toEqual([Area.Addition, Area.Subtraction].sort());
        expect(sample.evaluation.context.status).toBe('eligible');
        expect(sample.issues).toEqual([`Stored annotations omit a resolved Area: ${Area.Addition}.`]);
    });
    it('versions deterministic reports with current machinery and ontology only', async () => {
        const input = {projectRoot, spec: 'fixture', snapshot: snapshot([stored()])};
        const original = await inspectLabelDependencies(input);
        expect(await inspectLabelDependencies(input)).toEqual(original);
        expect(mocks.digest.mock.calls.map(([path]) => path).every((path: string) => !/evidence|realized-labels/.test(path))).toBe(true);
        mocks.digest.mockImplementation((path: string) => ({sha256: `changed:${path}`, bytes: 1}));
        const changed = await inspectLabelDependencies(input);
        expect(changed.policy_hash).not.toBe(original.policy_hash); expect(changed.subjects).toEqual(original.subjects);
        mocks.provenance.mockReturnValue({version: 'new-ontology'});
        expect((await inspectLabelDependencies(input)).policy_hash).not.toBe(changed.policy_hash);
    });
});
