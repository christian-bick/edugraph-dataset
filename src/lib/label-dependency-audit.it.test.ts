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
const withoutOperandWidths = (labels: readonly string[]) => labels.filter(label =>
    !labelDependencies.facets.operandDigits.labels.some(width => capabilitySatisfies(label, width)));
beforeAll(async () => {
    const generatorFiles = new Map([['arithmetic-ops-pairs', resolve(root, 'src/generators/arithmetic/arithmetic-ops-pairs/spec.ts')]]);
    const viewFiles = new Map([['operations-boxes', resolve(root, 'src/visuals/views/operations/operations-boxes/spec.ts')]]);
    const [generators, views] = await Promise.all([
        loadGeneratorModelCatalog(undefined, undefined, generatorFiles),
        loadViewModelCatalog(undefined, undefined, viewFiles)
    ]);
    const target = {id: 'dependency-audit-integration', labels: [Area.Addition, Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero, Scope.NumbersSmaller10, Ability.ProcedureExecution]};
    tuple = matchTargets([target], generators, views).tuples[0];
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
    it('adds one missing-base finding to existing declaration omissions without completing any labels', () => {
        const selected = enumerateDependencyAuditSelections(tuple.plan).selections[0];
        const original = [...selected.labels];
        const incomplete = withoutOperandWidths(selected.labels);
        const incompleteOriginal = [...incomplete];
        const withoutBase = incomplete.filter(label => label !== Scope.Base10);
        const withoutBaseOriginal = [...withoutBase];
        const evaluator = createLabelDependencyEvaluator();
        const report = (labels: readonly string[]) => buildLabelDependencyAudit({spec: 'integration', policyHash: evaluator.policyHash, ontology: {},
            dataset: {status: 'available', generationId: 'fixture'}, selectionCoverage: [], evaluate: evaluator.evaluate,
            subjects: [{kind: 'sample', id: 'stored:fixture', targetId: tuple.target.id, generatorId: tuple.generatorId,
                viewId: tuple.viewId, labels, targetAssociations: [{spec: 'integration', target_id: 'alias'}]}]});
        const baseline = summarizeLabelDependencyCoverage(report(incomplete));
        const modified = report(withoutBase);
        const strict = summarizeLabelDependencyCoverage(modified);
        expect(strict.failures).toContainEqual(expect.objectContaining({code: 'missing', facet: 'base'}));
        expect(strict.failures.length).toBe(baseline.failures.length + 1);
        expect(modified.findings.some(finding => finding.facet === 'base')).toBe(true);
        expect(modified.subjects[0].targetAssociations).toEqual([{spec: 'integration', target_id: 'alias'}]);
        expect(selected.labels).toEqual(original);
        expect(incomplete).toEqual(incompleteOriginal);
        expect(withoutBase).toEqual(withoutBaseOriginal);
        expect(incomplete).not.toContain(Scope.SingleDigitSmallestOperand);
    });
});
