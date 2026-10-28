import {beforeAll, describe, expect, it} from 'vitest';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Ability, Area, Scope} from 'edugraph-ts/generated';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from './model-catalog.ts';
import {matchTargets, type MatchTuple} from './matching.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import {summarizeLabelDependencyCoverage} from './label-dependency-coverage.ts';
import {buildLabelDependencyAudit, enumerateDependencyAuditSelections} from './label-dependency-audit.ts';
import {capabilitySatisfies} from './ontology.ts';
import {labelDependencies} from '../validation/label-dependencies.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
let tuple: MatchTuple;
let decimalTuple: MatchTuple;
const withoutOperandWidths = (labels: readonly string[]) => labels.filter(label =>
    !labelDependencies.facets.operandDigits.labels.some(width => capabilitySatisfies(label, width)));
beforeAll(async () => {
    const generatorFiles = new Map([
        ['arithmetic-ops-pairs', resolve(root, 'src/generators/arithmetic/arithmetic-ops-pairs/spec.ts')],
        ['decimal-place-comparison', resolve(root, 'src/generators/number/decimal-place-comparison/spec.ts')]
    ]);
    const viewFiles = new Map([
        ['operations-boxes', resolve(root, 'src/visuals/views/operations/operations-boxes/spec.ts')],
        ['numbers-decimal-place-comparison', resolve(root, 'src/visuals/views/numbers/numbers-decimal-place-comparison/spec.ts')]
    ]);
    const [generators, views] = await Promise.all([
        loadGeneratorModelCatalog(undefined, undefined, generatorFiles),
        loadViewModelCatalog(undefined, undefined, viewFiles)
    ]);
    const target = {id: 'dependency-audit-integration', labels: [Area.Addition, Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero, Scope.NumbersSmaller10, Ability.ProcedureExecution]};
    tuple = matchTargets([target], generators, views).tuples[0];
    const decimalTarget = {id: 'decimal-dependency-audit-integration', labels: [
        Area.NumericEquality, Scope.Equal, Ability.ProcedureExecution
    ]};
    decimalTuple = matchTargets([decimalTarget], generators, views).tuples[0];
});

describe('annotation audit with real matched declarations', () => {
    it('reports a removed width in every admitted conjunction without executing a mathematical draw', () => {
        expect(tuple).toBeDefined();
        const selections = enumerateDependencyAuditSelections(tuple.plan);
        expect(selections.status).toBe('complete');
        expect(Number(selections.total)).toBe(selections.selections.length);
        const evaluate = createLabelDependencyEvaluator().evaluate;
        for (const selection of selections.selections) {
            expect(selection.labels).toContain(Area.Addition);
            expect(selection.labels).toContain(Ability.ProcedureExecution);
            expect(evaluate(selection.labels).context.status).toBe('eligible');
            expect(evaluate(withoutOperandWidths(selection.labels)).assessments
                .find(item => item.facet === 'operandDigits')?.status).toBe('missing');
        }
    });
    it('reports conditional base obligations alongside an omission without completing any labels', () => {
        expect(decimalTuple).toBeDefined();
        expect(decimalTuple.generatorId).toBe('decimal-place-comparison');
        const selected = enumerateDependencyAuditSelections(decimalTuple.plan).selections[0];
        const original = [...selected.labels];
        const incomplete = selected.labels.filter(label => label !== Scope.NumbersWithoutNegatives);
        const incompleteOriginal = [...incomplete];
        const withoutBase = incomplete.filter(label => label !== Scope.Base10);
        const withoutBaseOriginal = [...withoutBase];
        const evaluator = createLabelDependencyEvaluator();
        const report = (labels: readonly string[]) => buildLabelDependencyAudit({spec: 'integration', policyHash: evaluator.policyHash, ontology: {},
            dataset: {status: 'available', generationId: 'fixture'}, selectionCoverage: [], evaluate: evaluator.evaluate,
            subjects: [{kind: 'sample', id: 'stored:fixture', targetId: decimalTuple.target.id, generatorId: decimalTuple.generatorId,
                viewId: decimalTuple.viewId, labels, targetAssociations: [{spec: 'integration', target_id: 'alias'}]}]});
        const baseline = summarizeLabelDependencyCoverage(report(incomplete));
        const modified = report(withoutBase);
        const strict = summarizeLabelDependencyCoverage(modified);
        expect(strict.failures.filter(failure => failure.facet === 'base').map(failure => failure.ruleId).sort())
            .toEqual(['LD-DECIMAL-01', 'LD-POSITIONAL-01']);
        expect(strict.failures.length).toBe(baseline.failures.length + 2);
        expect(modified.findings.filter(finding => finding.facet === 'base').map(finding => finding.ruleId).sort())
            .toEqual(['LD-DECIMAL-01', 'LD-POSITIONAL-01']);
        expect(modified.subjects[0].targetAssociations).toEqual([{spec: 'integration', target_id: 'alias'}]);
        expect(selected.labels).toEqual(original);
        expect(incomplete).toEqual(incompleteOriginal);
        expect(withoutBase).toEqual(withoutBaseOriginal);
        expect(incomplete).not.toContain(Scope.NumbersWithoutNegatives);
    });

    it('keeps representation completeness separate for a real arithmetic selection', () => {
        const selected = enumerateDependencyAuditSelections(tuple.plan).selections[0];
        const original = [...selected.labels];
        const annotations = selected.labels.filter(label => label !== Scope.ArabicNumerals && label !== Scope.Base10);
        const annotationSnapshot = [...annotations];
        const evaluator = createLabelDependencyEvaluator();
        const report = buildLabelDependencyAudit({spec: 'integration', policyHash: evaluator.policyHash, ontology: {},
            dataset: {status: 'available', generationId: 'fixture'}, selectionCoverage: [], evaluate: evaluator.evaluate,
            subjects: [{kind: 'sample', id: 'stored:arithmetic', targetId: tuple.target.id, generatorId: tuple.generatorId,
                viewId: tuple.viewId, labels: annotations}]});
        expect(report.findings.filter(finding => finding.facet !== 'range')).toEqual([]);
        expect(summarizeLabelDependencyCoverage(report).failures).toEqual([]);
        expect(annotations).toEqual(annotationSnapshot);
        expect(selected.labels).toEqual(original);
    });
});
