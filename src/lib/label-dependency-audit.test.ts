import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts/generated';
import type {GenerationPlan, LabelChoiceDomain} from '../types/compatibility.ts';
import {createGenerationSelectionReceipt, planCompatibility} from './compatibility.ts';
import {computeSampleKey, computeSampleSeed} from './generation.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import {buildLabelDependencyAudit, dependencyAuditResolvedAreas, dependencyAuditRowIssues,
    enumerateDependencyAuditSelections, formatLabelDependencyAudit,
    type DependencyAuditSubject} from './label-dependency-audit.ts';

const evaluator = createLabelDependencyEvaluator();
function plan(fields: LabelChoiceDomain[] = [], correlated = false): GenerationPlan {
    const result = planCompatibility({identity: {targetId: 'fixture', generatorId: 'g', viewId: 'v'},
        targetLabels: [Area.Addition], generatorLabels: [Area.Addition], viewLabels: [Ability.ProcedureExecution], fields,
        ...(correlated ? {viewRules: [{id: 'correlated', dependencies: fields.flatMap(field => field.alternatives.map(alternative =>
            ({scope: field.owner, label: alternative.labels[0]}))), predicate: labels =>
            labels.exact('generator', Scope.NumbersWithZero) === labels.exact('view', Scope.ArabicNumerals)}]} : {})});
    if (!result.supported) throw new Error('Fixture plan did not match.');
    return result.plan;
}
function row(currentPlan = plan()) {
    const sampleKey = computeSampleKey({...currentPlan.identity, split: 'train', mode: 'question', instanceIdx: 0});
    const seed = computeSampleSeed(sampleKey, 1);
    const selection = createGenerationSelectionReceipt(currentPlan,
        enumerateDependencyAuditSelections(currentPlan).selections[0].choices);
    return {file_name: 'fixture.png', sample_key: sampleKey, spec: 'fixture', target_id: 'fixture',
        generator: 'g', view: 'v', mode: 'question', labels: ['Addition'],
        generation_plan: currentPlan, generation_plan_hash: currentPlan.hash,
        generation_replay: {version: 1, sampleKey, attempt: 1, seed, selection}, seed, attempt: 1};
}

describe('admitted annotation selections', () => {
    it('includes an invariant-only selection independently of partial target labels', () => {
        expect(enumerateDependencyAuditSelections(plan())).toEqual({status: 'complete', total: '1', selections: [
            {labels: [Ability.ProcedureExecution, Area.Addition].sort(), choices: [], variantHash: expect.any(String)}
        ]});
    });
    it('preserves correlations and independent alternatives without unioning them', () => {
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
    it('reports oversized spaces without a sampled completeness claim', () => {
        const fields: LabelChoiceDomain[] = [{owner: 'generator', field: 'base', alternatives: [
            {id: 'one', labels: [Scope.Base10]}, {id: 'two', labels: [Scope.Base2]}
        ]}];
        expect(enumerateDependencyAuditSelections(plan(fields), 1)).toEqual({status: 'limit_exceeded', total: '2', selections: []});
        expect(() => enumerateDependencyAuditSelections({...plan(), hash: 'corrupt'})).toThrow();
    });
    it.each([0, -1, 1.5, 4097, NaN])('rejects invalid enumeration limit %s', limit => {
        expect(() => enumerateDependencyAuditSelections(plan(), limit)).toThrow('Selection limit');
    });
});

describe('annotation provenance without mathematical replay', () => {
    it('checks sample identity and split without any generator implementation', () => {
        const stored = row();
        expect(dependencyAuditRowIssues(stored, 'train')).toEqual([]);
        expect(dependencyAuditRowIssues({...stored, generator: 'other', view: 'other', mode: 'solution', target_id: 'wrong'}, 'val')).toHaveLength(5);
        expect(dependencyAuditRowIssues({...stored, sample_key: 'invalid'}, 'train')[0]).toContain('Malformed sample key');
    });
    it('recovers invariant and selected Areas independently of incomplete stored labels', () => {
        expect(dependencyAuditResolvedAreas(row())).toEqual({areas: [Area.Addition], issues: []});
        const currentPlan = plan([{owner: 'generator', field: 'area', alternatives: [
            {id: 'algebra', labels: [Area.AlgebraicExpression]}
        ]}]);
        expect(dependencyAuditResolvedAreas(row(currentPlan))).toEqual({areas: [Area.Addition, Area.AlgebraicExpression].sort(), issues: []});
    });
    it('retains invalid metadata as a structural contract finding', () => {
        const stored = row();
        expect(dependencyAuditResolvedAreas({...stored, generation_replay: undefined})).toMatchObject({areas: [], issues: [expect.stringContaining('no generation plan/receipt')]});
        expect(dependencyAuditResolvedAreas({...stored, generation_plan_hash: 'stale'})).toMatchObject({areas: [], issues: [expect.stringContaining('hash mismatch')]});
    });
});

describe('deterministic annotation reports', () => {
    const subject = (id: string): DependencyAuditSubject => ({id, kind: 'sample', targetId: 'fixture',
        generatorId: 'unknown-producer', viewId: 'unknown-view', labels: [Area.Addition, Scope.IntegerNumbers]});
    const build = (subjects: DependencyAuditSubject[]) => buildLabelDependencyAudit({spec: 'fixture', policyHash: 'policy',
        ontology: {version: 'fixture'}, dataset: {status: 'available', generationId: 'same'},
        selectionCoverage: [{targetId: 'limited', generatorId: 'g', viewId: 'v', status: 'limit_exceeded', total: '8192', checked: 0}],
        subjects, evaluate: evaluator.evaluate});
    it('groups omissions, preserves provenance, and is independent of input order', () => {
        const first = subject('sample:a');
        const second = {...subject('sample:b'), targetAssociations: [{spec: 'fixture', target_id: 'alias'}]};
        const report = build([second, first]);
        expect(report).toEqual(build([first, second]));
        expect(report).toMatchObject({schema_version: 3, mode: 'report-only', validation_basis: 'annotations'});
        expect(report.summary).toMatchObject({samples: 2, selections: 0, samples_with_missing_dependencies: 2, incomplete_tuples: 1});
        expect(report.findings.find(finding => finding.facet === 'range')?.subjects).toEqual(['sample:a', 'sample:b']);
        expect(report.subjects[1].targetAssociations).toEqual(second.targetAssociations);
        expect(first.labels).toEqual(subject('sample:a').labels);
        const markdown = formatLabelDependencyAudit(report);
        expect(markdown).toContain('Range presence remains report-only');
        expect(markdown).toContain('limit_exceeded');
        expect(markdown).not.toMatch(/adapter|supplementary|replay|evidence/i);
        expect(markdown).toBe(formatLabelDependencyAudit(build([first, second])));
    });
    it('uses all resolved Areas and retains invalid annotations and row issues', () => {
        const report = build([
            {...subject('outside'), resolvedAreas: [Area.EquationSolving]},
            {...subject('unknown'), labels: ['http://edugraph.io/edu/Missing'], issues: ['invalid\nrow | missing', 'invalid\nrow | missing']},
            {...subject('selection'), kind: 'selection'}
        ]);
        expect(report.summary.contexts).toEqual({eligible: 1, outside_policy_scope: 1, invalid_context: 1});
        expect(report.summary.row_issues).toBe(1);
        expect(report.summary.contract_errors).toBeGreaterThan(0);
        expect(formatLabelDependencyAudit(report)).toContain('invalid row \\| missing');
    });
    it('reports conflicts independently of missing groups', () => {
        const labels = [Area.Addition, Scope.IntegerNumbers, Scope.ArabicNumerals, Scope.Base10,
            Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero, Scope.NumbersWithZero, Scope.NumbersSmaller10];
        const report = build([{...subject('conflict'), labels}]);
        expect(report.summary).toMatchObject({conflicts: 1, assessments: {missing: 0}, samples_with_missing_dependencies: 0});
        expect(report.findings).toEqual([]);
        expect(formatLabelDependencyAudit(report)).toContain('LD-ZERO-CONFLICT-01/zero');
    });
    it('orders tuple coverage independently and renders incomplete-plan reasons', () => {
        const complete = {targetId: 'a', generatorId: 'g', viewId: 'v', status: 'complete' as const, total: '1', checked: 1};
        const invalid = {targetId: 'z', generatorId: 'g', viewId: 'v', status: 'invalid_plan' as const,
            total: 'unknown', checked: 0, reason: 'Invalid | assignment'};
        const input = {spec: 'fixture', policyHash: 'p', ontology: {}, dataset: {status: 'available' as const, generationId: 'fixture'},
            subjects: [subject('sample')], evaluate: evaluator.evaluate};
        const report = buildLabelDependencyAudit({...input, selectionCoverage: [invalid, complete]});
        expect(report).toEqual(buildLabelDependencyAudit({...input, selectionCoverage: [complete, invalid]}));
        expect(report.selection_coverage).toEqual([complete, invalid]);
        expect(formatLabelDependencyAudit(report)).toContain('Invalid \\| assignment');
    });
    it('keeps an unavailable empty snapshot explicit without inventing findings', () => {
        const report = buildLabelDependencyAudit({spec: 'fixture', policyHash: 'p', ontology: {},
            dataset: {status: 'unavailable', generationId: null}, selectionCoverage: [], subjects: [], evaluate: evaluator.evaluate});
        expect(report.summary.samples).toBe(0);
        expect(formatLabelDependencyAudit(report)).toContain('No activated annotation dependencies are missing.');
        expect(formatLabelDependencyAudit(report)).toContain('generation `none`');
    });
});
