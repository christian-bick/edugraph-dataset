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
        expect(report).toMatchObject({schema_version: 4, mode: 'report-only', validation_basis: 'annotations'});
        expect(report.summary).toMatchObject({samples: 2, selections: 0, samples_with_missing_dependencies: 2, incomplete_tuples: 1});
        expect(report.findings.find(finding => finding.facet === 'range')?.subjects).toEqual(['sample:a', 'sample:b']);
        expect(report.subjects[1].targetAssociations).toEqual(second.targetAssociations);
        expect(first.labels).toEqual(subject('sample:a').labels);
        const markdown = formatLabelDependencyAudit(report);
        expect(markdown).toContain('Range presence remains report-only; contextual range exclusions are enforced.');
        expect(markdown).not.toContain('range-policy work is excluded');
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

    it('retires symbolic source range omissions while retaining numeric-structure obligations and exact annotations', () => {
        const result = planCompatibility({identity: {targetId: 'structural-role', generatorId: 'g', viewId: 'v'},
            targetLabels: [Area.Term], generatorLabels: [Area.Term, Scope.IntegerNumbers],
            viewLabels: [Scope.ArabicNumerals, Ability.ConceptClassification], fields: [{
                owner: 'generator', field: 'frame', alternatives: [
                    {id: 'numeric', labels: [Area.ArithmeticExpression]},
                    {id: 'symbolic', labels: [Area.AlgebraicExpression]}
                ]
            }]});
        if (!result.supported) throw new Error('Structural fixture did not match.');
        const originalPlan = JSON.stringify(result.plan);
        const selections = enumerateDependencyAuditSelections(result.plan);
        expect(selections.status).toBe('complete');
        expect(selections.selections).toHaveLength(2);
        const subjects: DependencyAuditSubject[] = selections.selections.map(selection => ({
            ...subject(selection.labels.includes(Area.AlgebraicExpression) ? 'symbolic' : 'numeric'),
            kind: 'selection', targetId: 'structural-role', labels: selection.labels,
            planHash: result.plan.hash, variantHash: selection.variantHash
        }));
        const originalAnnotations = subjects.map(value => [...value.labels]);
        const report = build(subjects);
        const symbolic = report.subjects.find(value => value.id === 'symbolic')!;
        expect(symbolic.evaluation.context.status).toBe('eligible');
        expect(symbolic.evaluation.assessments).toEqual([
            expect.objectContaining({ruleId: 'LD-NUM-01', facet: 'numberKind', status: 'satisfied'})
        ]);
        expect(symbolic.evaluation.conflicts).toEqual([]);
        expect(report.findings.map(finding => finding.facet).sort()).toEqual(['range', 'sign', 'zero']);
        expect(report.findings.every(finding => finding.subjects.length === 1 && finding.subjects[0] === 'numeric')).toBe(true);
        expect(report.subjects.map(value => [value.id, value.labels])).toEqual(subjects
            .map(value => [value.id, [...value.labels].sort()]).sort(([left], [right]) => String(left).localeCompare(String(right))));
        expect(subjects.map(value => value.labels)).toEqual(originalAnnotations);
        expect(JSON.stringify(result.plan)).toBe(originalPlan);
    });

    it('reports forbidden algebra ranges as conflicts without erasing them or arithmetic range omissions', () => {
        const subjects = [
            {...subject('symbolic'), labels: [Area.AlgebraicExpression, Scope.IntegerNumbers, Scope.NumbersSmaller20]},
            {...subject('bound-equation'), labels: [Area.EquationSolving, Area.Addition, Scope.RationalNumbers, Scope.NumbersSmaller20]},
            {...subject('arithmetic'), labels: [Area.Addition, Scope.IntegerNumbers,
                Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]}
        ];
        const original = JSON.stringify(subjects);
        const report = build(subjects);
        expect(report.summary).toMatchObject({samples: 3, conflicts: 2,
            contexts: {eligible: 2, outside_policy_scope: 1, invalid_context: 0},
            assessments: {missing: 1}, samples_with_missing_dependencies: 0});
        expect(report.findings).toEqual([
            expect.objectContaining({ruleId: 'LD-NUM-01', facet: 'range', subjects: ['arithmetic']})
        ]);
        for (const id of ['symbolic', 'bound-equation']) {
            const value = report.subjects.find(value => value.id === id)!;
            expect(value.labels).toContain(Scope.NumbersSmaller20);
            expect(value.evaluation.conflicts).toEqual([
                expect.objectContaining({ruleId: 'LD-ALGEBRA-RANGE-01', facet: 'range', labels: [Scope.NumbersSmaller20]})
            ]);
        }
        const markdown = formatLabelDependencyAudit(report);
        expect(markdown).toContain('LD-ALGEBRA-RANGE-01/range');
        expect(markdown).toContain('Range presence remains report-only; contextual range exclusions are enforced.');
        expect(markdown).not.toContain('range-policy work is excluded');
        expect(JSON.stringify(subjects)).toBe(original);
    });

    it.each([Area.UnknownVariable, Area.GeneralizedVariable])(
        'preserves actual %s annotations and rejects only the future range claim', role => {
            const actual: DependencyAuditSubject = {id: 'actual-role', kind: 'selection', targetId: 'variable-role',
                generatorId: 'algebra-variable-models', viewId: 'algebra-variable-interpretation',
                labels: [role, Ability.Interpretation]};
            const ranged: DependencyAuditSubject = {...actual, id: 'ranged-role', kind: 'sample', labels: [
                ...actual.labels, Scope.RationalNumbers, Scope.NumbersWithoutNegatives,
                Scope.NumbersWithoutZero, Scope.NumbersSmaller10
            ]};
            const original = JSON.stringify([actual, ranged]);
            const report = build([actual, ranged]);
            expect(report.summary).toMatchObject({selections: 1, samples: 1, conflicts: 1,
                assessments: {missing: 0}, contexts: {eligible: 2, outside_policy_scope: 0}});
            expect(report.findings).toEqual([]);
            const actualResult = report.subjects.find(value => value.id === actual.id)!;
            expect(actualResult.labels).toEqual([...actual.labels].sort());
            expect(actualResult.evaluation.assessments).toEqual([]);
            expect(actualResult.evaluation.conflicts).toEqual([]);
            const rangedResult = report.subjects.find(value => value.id === ranged.id)!;
            expect(rangedResult.labels).toEqual([...ranged.labels].sort());
            expect(rangedResult.evaluation.assessments.map(value => [value.facet, value.status])).toEqual([
                ['numberKind', 'satisfied'], ['sign', 'satisfied'], ['zero', 'satisfied']
            ]);
            expect(rangedResult.evaluation.conflicts).toEqual([
                expect.objectContaining({ruleId: 'LD-ALGEBRA-RANGE-01', facet: 'range', labels: [Scope.NumbersSmaller10]})
            ]);
            expect(JSON.stringify([actual, ranged])).toBe(original);
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
