import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts/generated';
import type {GenerationPlan, LabelChoiceDomain} from '../types/compatibility.ts';
import type {ProblemGenerator} from '../types/ml-engine.ts';
import type {DependencyGraphSnapshot} from './dependency-planner.ts';
import {createGenerationSelectionReceipt, planCompatibility} from './compatibility.ts';
import {computeContentFingerprint, computeSampleKey, computeSampleSeed, computeTaskFingerprint} from './generation.ts';
import {generatePlannedDraw} from './planned-generation.ts';
import {getRandomState, random, setRandomState} from './random.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import {assessLabelDependencyEvidence} from './label-dependency-evidence.ts';
import {buildLabelDependencyAudit, dependencyAuditResolvedAreas, dependencyAuditRowIssues, dependencyAuditSourceIssues,
    enumerateDependencyAuditSelections, formatLabelDependencyAudit, replayDependencyAuditRow,
    type DependencyAuditSubject} from './label-dependency-audit.ts';

const evaluator = createLabelDependencyEvaluator();
const data = {operation: 'addition', num1: 6, num2: 2, answer: 8};
const generator: ProblemGenerator = {type: 'arithmetic', schema: {}, generate: () => ({data})};

function plan(fields: LabelChoiceDomain[] = [], correlated = false): GenerationPlan {
    const result = planCompatibility({identity: {targetId: 'fixture', generatorId: 'arithmetic-ops-pairs', viewId: 'operations-boxes'},
        targetLabels: [Area.Addition], generatorLabels: [Area.Addition], viewLabels: [Ability.ProcedureExecution], fields,
        ...(correlated ? {viewRules: [{id: 'correlated', dependencies: fields.flatMap(field => field.alternatives.map(alternative =>
            ({scope: field.owner, label: alternative.labels[0]}))), predicate: labels =>
            labels.exact('generator', Scope.NumbersWithZero) === labels.exact('view', Scope.ArabicNumerals)}]} : {})});
    if (!result.supported) throw new Error('Fixture plan did not match.');
    return result.plan;
}

function row() {
    const checked = planCompatibility({identity: {targetId: 'fixture', generatorId: 'arithmetic-ops-pairs', viewId: 'operations-boxes'},
        targetLabels: [Area.Addition], generatorLabels: [Area.Addition, Scope.IntegerNumbers, Scope.Base10,
            Scope.TwoOperands, Scope.NumbersWithoutNegatives], viewLabels: [Ability.ProcedureExecution, Scope.ArabicNumerals], fields: []});
    if (!checked.supported) throw new Error('Complete fixture plan did not match.');
    const currentPlan = checked.plan;
    const sampleKey = computeSampleKey({...currentPlan.identity, split: 'train', mode: 'question', instanceIdx: 0});
    const seed = computeSampleSeed(sampleKey, 1);
    const draw = generatePlannedDraw({generator, viewSchema: {}, plan: currentPlan, sampleKey, attempt: 1, seed});
    return {file_name: 'fixture.png', sample_key: sampleKey, spec: 'fixture', target_id: 'fixture',
        generator: 'arithmetic-ops-pairs', view: 'operations-boxes', mode: 'question',
        labels: ['Addition'], realized_labels: draw.realizedLabels,
        generation_plan: currentPlan, generation_plan_hash: currentPlan.hash,
        generation_replay: draw.replay, seed, attempt: 1,
        content_fingerprint: computeContentFingerprint(data), task_fingerprint: computeTaskFingerprint(data, draw.view.config)};
}

describe('admitted dependency audit selections', () => {
    it('includes one invariant-only selection, independently of target labels', () => {
        const selections = enumerateDependencyAuditSelections(plan());
        expect(selections.status).toBe('complete');
        expect(selections.total).toBe('1');
        expect(selections.selections[0].labels).toEqual([Ability.ProcedureExecution, Area.Addition].sort());
        expect(selections.selections[0].choices).toEqual([]);
    });

    it('preserves correlations and combines independent factors without unioning alternatives', () => {
        const fields: LabelChoiceDomain[] = [
            {owner: 'generator', field: 'zero', alternatives: [{id: 'yes', labels: [Scope.NumbersWithZero]}, {id: 'no', labels: [Scope.NumbersWithoutZero]}]},
            {owner: 'view', field: 'notation', alternatives: [{id: 'arabic', labels: [Scope.ArabicNumerals]}, {id: 'roman', labels: [Scope.RomanNumerals]}]},
            {owner: 'view', field: 'base', alternatives: [{id: 'ten', labels: [Scope.Base10]}, {id: 'two', labels: [Scope.Base2]}]}
        ];
        const selections = enumerateDependencyAuditSelections(plan(fields, true));
        expect(selections.total).toBe('4');
        expect(new Set(selections.selections.map(selection => selection.variantHash)).size).toBe(4);
        for (const selection of selections.selections) {
            expect(selection.labels.includes(Scope.NumbersWithZero)).toBe(selection.labels.includes(Scope.ArabicNumerals));
            expect(selection.labels.includes(Scope.Base10)).not.toBe(selection.labels.includes(Scope.Base2));
            expect(selection.choices).toHaveLength(3);
        }
    });

    it('reports uninspected oversized spaces instead of sampling an apparently exhaustive subset', () => {
        const fields: LabelChoiceDomain[] = [{owner: 'generator', field: 'notation', alternatives: [
            {id: 'one', labels: [Scope.Base10]}, {id: 'two', labels: [Scope.Base2]}
        ]}];
        expect(enumerateDependencyAuditSelections(plan(fields), 1)).toEqual({status: 'limit_exceeded', total: '2', selections: []});
        for (const limit of [0, -1, 1.5, 4097, NaN]) expect(() => enumerateDependencyAuditSelections(plan(), limit)).toThrow('Selection limit');
        expect(() => enumerateDependencyAuditSelections({...plan(), hash: 'corrupt'})).toThrow();
    });
});

describe('stored sample evidence provenance', () => {
    it('checks every row identity and split even when its adapter is unsupported', () => {
        const stored = row();
        expect(dependencyAuditRowIssues(stored, 'train')).toEqual([]);
        expect(dependencyAuditRowIssues({...stored, generator: 'unknown', view: 'unknown', mode: 'solution', target_id: 'wrong'}, 'val')).toHaveLength(5);
        expect(dependencyAuditRowIssues({...stored, sample_key: 'invalid'}, 'train')[0]).toContain('Malformed sample key');
    });
    it('recovers the complete resolved Areas independently of incomplete stored labels', () => {
        const stored = row();
        expect(dependencyAuditResolvedAreas(stored)).toEqual({areas: [Area.Addition], issues: []});
        expect(dependencyAuditResolvedAreas({...stored, generation_replay: undefined}).issues).toHaveLength(1);
        const fields: LabelChoiceDomain[] = [{owner: 'generator', field: 'area', alternatives: [
            {id: 'algebra', labels: [Area.AlgebraicExpression]}
        ]}];
        const currentPlan = plan(fields);
        const selection = createGenerationSelectionReceipt(currentPlan, enumerateDependencyAuditSelections(currentPlan).selections[0].choices);
        expect(dependencyAuditResolvedAreas({...stored, generation_plan: currentPlan, generation_plan_hash: currentPlan.hash,
            generation_replay: {...stored.generation_replay, selection}}).areas).toEqual([Area.Addition, Area.AlgebraicExpression].sort());
    });

    it('checks full source closures and reports missing/stale source identities', () => {
        const nodes = {
            'generator:g': {id: 'generator:g', kind: 'generator-module', input_hash: 'g', dependencies: ['source:src/g.ts', 'generator-capability:g']},
            'view:v': {id: 'view:v', kind: 'view-module', input_hash: 'v', dependencies: ['source:src/v.ts']},
            'source:src/g.ts': {id: 'source:src/g.ts', kind: 'source-file', input_hash: 'g-hash', dependencies: []},
            'source:src/v.ts': {id: 'source:src/v.ts', kind: 'source-file', input_hash: 'v-hash', dependencies: []}
        } as DependencyGraphSnapshot['nodes'];
        const graph: DependencyGraphSnapshot = {schema_version: 5, planner_epoch: 6, complete: true, nodes};
        const input = {graph, generatorId: 'g', viewId: 'v', sourceHash: (path: string) => path.includes('g.ts') ? 'g-hash' : 'v-hash'};
        expect(dependencyAuditSourceIssues(input)).toEqual([]);
        expect(dependencyAuditSourceIssues({...input, sourceHash: () => undefined})).toHaveLength(2);
        expect(dependencyAuditSourceIssues({...input, graph: undefined})).toHaveLength(2);
        nodes['view:v'].dependencies = [];
        expect(dependencyAuditSourceIssues(input)).toEqual(['No stored view source closure for v.']);
    });

    it('verifies content and task fingerprints and restores random state', () => {
        const stored = row();
        setRandomState(123);
        const result = replayDependencyAuditRow({row: stored, currentPlan: stored.generation_plan, generator,
            viewSchema: {}, sourceIssues: []});
        expect(result.status).toBe('verified');
        expect(result.evidence.triggers.numericTask?.status).toBe('present');
        expect(getRandomState()).toBe(123);
        expect(result.issues).toEqual([]);
    });

    it('allows solution reuse of the question origin while preserving actual mode', () => {
        const stored = row();
        const result = replayDependencyAuditRow({row: {...stored, sample_key: stored.sample_key.replace('#question#', '#solution#'), mode: 'solution'},
            currentPlan: stored.generation_plan, generator, viewSchema: {}, sourceIssues: []});
        expect(result.status).toBe('verified');
        expect(result.evidence.facets.base.references).toContain('view:operations-boxes:solution');
    });

    it.each(['content_fingerprint', 'task_fingerprint'] as const)('does not trust mismatched %s', field => {
        const stored = row();
        const result = replayDependencyAuditRow({row: {...stored, [field]: 'wrong'}, currentPlan: stored.generation_plan,
            generator, viewSchema: {}, sourceIssues: []});
        expect(result.status).toBe('unresolved');
        expect(result.issues[0]).toContain('fingerprint');
        expect(result.evidence.triggers.numericTask?.status).toBe('unresolved');
    });

    it('keeps identity/plan/source failures explicit and never samples a replacement', () => {
        const stored = row();
        const run = (input: Partial<Parameters<typeof replayDependencyAuditRow>[0]>) => replayDependencyAuditRow({
            row: stored, currentPlan: stored.generation_plan, generator, viewSchema: {}, sourceIssues: [], ...input});
        expect(run({sourceIssues: ['view changed']}).issues).toEqual(['view changed']);
        expect(run({currentPlan: undefined}).issues[0]).toContain('stale');
        expect(run({generator: undefined}).issues[0]).toContain('unavailable');
        expect(run({viewSchema: undefined}).status).toBe('unresolved');
        const staleReceipt = run({row: {...stored, realized_labels: {version: 1, policyHash: 'stale'}}});
        expect(staleReceipt.issues[0]).toContain('realized-label receipt');
        expect(staleReceipt.status).toBe('verified');
        expect(staleReceipt.evidence.triggers.numericTask?.status).toBe('present');
        expect(run({row: {...stored, target_id: 'other'}}).issues[0]).toContain('identity');
        expect(run({generator: {...generator, generate: () => null}}).issues[0]).toContain('no mathematical payload');
        expect(run({generator: {...generator, generate: () => {random(); throw 'failed';}}}).issues[0]).toBe('failed');
    });
});

describe('deterministic report-only dependency audit', () => {
    const evidence = assessLabelDependencyEvidence({generatorId: 'arithmetic-ops-pairs', viewId: 'operations-boxes', mode: 'question', data});
    const subject = (id: string): DependencyAuditSubject => ({id, kind: 'sample', targetId: 'fixture',
        generatorId: 'arithmetic-ops-pairs', viewId: 'operations-boxes', labels: [Area.Addition, Scope.IntegerNumbers], evidence, replay: 'verified'});
    const build = (subjects: DependencyAuditSubject[]) => buildLabelDependencyAudit({spec: 'fixture', policyHash: 'policy',
        ontology: {version: 'fixture'}, dataset: {status: 'available', generationId: 'same'},
        selectionCoverage: [{targetId: 'limited', generatorId: 'g', viewId: 'v', status: 'limit_exceeded', total: '8192', checked: 0}],
        subjects, evaluate: evaluator.evaluate});

    it('groups missing dependencies, retains sample provenance, and is independent of input order', () => {
        const first = subject('sample:a');
        const second = {...subject('sample:b'), targetAssociations: [{spec: 'fixture', target_id: 'alias'}]};
        const report = build([second, first]);
        expect(report).toEqual(build([first, second]));
        expect(report.mode).toBe('report-only');
        expect(report.summary.assessments.missing).toBeGreaterThan(0);
        expect(report.summary.incomplete_tuples).toBe(1);
        expect(report.findings.find(finding => finding.facet === 'range')?.subjects).toEqual(['sample:a', 'sample:b']);
        expect(report.subjects[1].targetAssociations).toEqual(second.targetAssociations);
        const markdown = formatLabelDependencyAudit(report);
        expect(markdown).toContain('Range presence remains report-only');
        expect(markdown).toContain('limit_exceeded');
        expect(markdown).toContain('integer-arithmetic-v1');
        expect(markdown).toBe(formatLabelDependencyAudit(build([first, second])));
    });

    it('uses all resolved Areas for scope and reports invalid contexts and evidence coverage', () => {
        const unresolved = assessLabelDependencyEvidence({generatorId: 'uncovered', viewId: 'v', mode: 'question'});
        const report = build([
            {...subject('outside'), resolvedAreas: [Area.EquationSolving], replay: 'unsupported'},
            {...subject('unknown'), labels: ['http://edugraph.io/edu/Missing'], issues: ['stale\nsource | missing'], replay: 'unresolved'},
            {...subject('unresolved'), kind: 'selection', evidence: unresolved, replay: undefined}
        ]);
        expect(report.summary.contexts).toEqual({eligible: 1, outside_policy_scope: 1, invalid_context: 1});
        expect(report.summary.unresolved_triggers).toBeGreaterThan(0);
        expect(report.summary.contract_errors).toBeGreaterThan(0);
        const markdown = formatLabelDependencyAudit(report);
        expect(markdown).toContain('trigger unresolved');
        expect(markdown).toContain('stale source \\| missing');
    });

    it('does not advertise completeness for an empty dataset or an eligible context with unresolved triggers', () => {
        const report = buildLabelDependencyAudit({spec: 'fixture', policyHash: 'p', ontology: {},
            dataset: {status: 'unavailable', generationId: null}, selectionCoverage: [], subjects: [], evaluate: evaluator.evaluate});
        expect(report.summary.samples).toBe(0);
        expect(formatLabelDependencyAudit(report)).toContain('No activated annotation dependencies are missing');
        expect(formatLabelDependencyAudit(report)).toContain('generation `none`');
    });
});
