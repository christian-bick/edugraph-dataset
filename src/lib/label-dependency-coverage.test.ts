import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts/generated';
import {labelDependencyCoverage} from '../validation/label-dependency-coverage.ts';
import {assessLabelDependencyEvidence} from './label-dependency-evidence.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import {ResolvedLabelContractError} from './label-contracts.ts';
import {assessLabelDependencyCoverage, assertLabelDependencyCoverage, LABEL_DEPENDENCY_COVERAGE_HASH,
    LabelDependencyCoverageError, summarizeLabelDependencyCoverage,
    type LabelDependencyCoverageInput} from './label-dependency-coverage.ts';

const evaluator = createLabelDependencyEvaluator();
const labels: string[] = [Area.Addition, Scope.IntegerNumbers, Scope.ArabicNumerals, Scope.Base10,
    Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero, Scope.TwoOperands,
    Scope.SingleDigitSmallestOperand, Scope.SingleDigitLargestOperand];
const input = (extra: Partial<LabelDependencyCoverageInput> = {}): LabelDependencyCoverageInput => ({
    generatorId: 'unreviewed-producer', viewId: 'unreviewed-projection', labels, ...extra
});
const assess = (extra: Partial<LabelDependencyCoverageInput> = {}) => assessLabelDependencyCoverage(input(extra));

describe('universal annotation dependency enforcement', () => {
    it('checks eligible annotations without registering a generator, view, payload, or adapter', () => {
        const result = assess();
        expect(result.status).toBe('checked');
        expect(result.completenessEnforced).toBe(true);
        expect(result.checkedFacets).toHaveLength(7);
        expect(result.reportOnlyFacets).toEqual(['LD-NUM-01/range']);
        expect(result.failures).toEqual([]);
        expect(result.coverageHash).toBe(LABEL_DEPENDENCY_COVERAGE_HASH);
        expect(result.coverageHash).toMatch(/^[a-f\d]{64}$/);
        expect(labelDependencyCoverage.scope).toBe('all-eligible-annotations');
    });

    it.each([
        [Scope.IntegerNumbers, 'numberKind'], [Scope.ArabicNumerals, 'numeralSystem'], [Scope.Base10, 'base'],
        [Scope.NumbersWithoutNegatives, 'sign'], [Scope.NumbersWithoutZero, 'zero'],
        [Scope.TwoOperands, 'operandCount']
    ])('fails an omitted %s group using only the remaining annotations', (label, facet) => {
        expect(assess({labels: labels.filter(value => value !== label)}).failures).toEqual([
            expect.objectContaining({code: 'missing', facet})
        ]);
    });

    it('requires a digit descriptor but does not invent a particular numeric profile', () => {
        const oneDigitLabel = assess({labels: labels.filter(label => label !== Scope.SingleDigitLargestOperand)});
        expect(oneDigitLabel.failures).toEqual([]);
        const noDigitLabels = assess({labels: labels.filter(label => label !== Scope.SingleDigitLargestOperand
            && label !== Scope.SingleDigitSmallestOperand)});
        expect(noDigitLabels.failures).toEqual([expect.objectContaining({code: 'missing', facet: 'operandDigits'})]);
    });

    it('enforces new producer/view combinations identically to existing reviewed projections', () => {
        const omitted = {labels: labels.filter(label => label !== Scope.Base10)};
        expect(assess(omitted).failures).toEqual(assess({...omitted,
            generatorId: 'arithmetic-ops-pairs', viewId: 'operations-boxes'}).failures);
    });

    it('does not let optional evidence mark an annotation dependency inapplicable', () => {
        const evidence = assessLabelDependencyEvidence({generatorId: 'counting-basic',
            viewId: 'counting-conservation', mode: 'question', data: {numObjects: 3, simpleAnswer: 3}});
        const reduced = labels.filter(label => label !== Scope.ArabicNumerals && label !== Scope.Base10);
        const result = assess({labels: reduced, evidence});
        expect(result.failures.map(failure => failure.facet)).toEqual(['base', 'numeralSystem']);
        expect(result).toEqual(assess({labels: reduced}));
    });

    it('ignores unavailable or malformed supplementary evidence when annotations are complete', () => {
        const unavailable = assessLabelDependencyEvidence({generatorId: 'unknown', viewId: 'unknown', mode: 'question'});
        expect(assess({evidence: unavailable})).toEqual(assess());
        const contradictory = {...unavailable, facets: {zero: {status: 'applicable' as const,
            expectedLabels: [Scope.NumbersWithZero], reason: 'A payload-only diagnostic.', references: ['payload']}}};
        expect(assess({evidence: contradictory})).toEqual(assess());
    });

    it.each([
        [Scope.NumbersWithZero, 'zero'], [Scope.NumbersWithNegatives, 'sign']
    ])('rejects contradictory %s annotations for an unreviewed producer', (opposite, facet) => {
        expect(assess({labels: [...labels, opposite]}).failures).toEqual([
            expect.objectContaining({code: 'contradiction', facet})
        ]);
    });

    it('checks frame conflicts even without an active quantity-reference-frame trigger', () => {
        expect(assess({labels: [Area.Addition, Scope.SingleFrameOfReference, Scope.MultipleFramesOfReference]}).failures)
            .toEqual([expect.objectContaining({code: 'contradiction', facet: 'referenceFrames'})]);
    });

    it('permits mixed operand counts and fraction classifications describing different expressions', () => {
        expect(assess({labels: [...labels, Scope.ThreeOperands, Scope.FourOperands,
            Scope.ProperFractions, Scope.ImproperFractions, Scope.UnitFractions, Scope.NonUnitFractions]}).failures).toEqual([]);
    });

    it('enforces exhaustive fraction/decimal dependencies while leaving evidence-only refinements supplementary', () => {
        expect(assess({labels: [...labels, Scope.FractionNumbers]}).failures)
            .toEqual([expect.objectContaining({code: 'missing', facet: 'fractionMagnitude'})]);
        expect(assess({labels: [...labels, Scope.ProperFractions]}).failures).toEqual([]);
        expect(assess({labels: [...labels, Scope.DecimalNumbers]}).failures).toEqual([]);
        expect(assess({labels: [...labels.filter(label => label !== Scope.Base10), Scope.DecimalNumbers]}).failures)
            .toEqual(expect.arrayContaining([expect.objectContaining({code: 'missing', facet: 'base'})]));
    });

    it('preserves the complete positive Area allowlist and outside contexts', () => {
        expect(assess({labels: [...labels, Area.AlgebraicExpression]}).status).toBe('checked');
        const outside = assess({labels: [...labels, Area.EquationSolving, Scope.NumbersWithZero]});
        expect(outside.status).toBe('outside_policy_scope');
        expect(outside.failures).toEqual([]);
        expect(assess({resolvedAreas: [Area.EquationSolving]}).status).toBe('outside_policy_scope');
    });

    it('fails unknown annotations and missing or malformed Area context', () => {
        expect(assess({labels: []}).failures).toEqual(expect.arrayContaining([
            expect.objectContaining({code: 'context'}), expect.objectContaining({code: 'contract'})
        ]));
        expect(assess({labels: [...labels, 'unknown']}).failures).toEqual(expect.arrayContaining([
            expect.objectContaining({code: 'context'}), expect.objectContaining({code: 'contract'})
        ]));
    });

    it('keeps structural metadata failures strict outside the Area policy as well', () => {
        const result = assess({labels: [Area.EquationSolving], issues: ['invalid label row', 'invalid label row']});
        expect(result.failures).toEqual([{code: 'annotation', message: 'invalid label row'}]);
    });

    it('reports pre-draw completeness without enforcing omissions that completion can fill', () => {
        const result = assess({kind: 'selection', labels: [Area.Addition, Scope.IntegerNumbers]});
        expect(result.status).toBe('checked');
        expect(result.completenessEnforced).toBe(false);
        expect(result.checkedFacets).toEqual([]);
        expect(result.reportOnlyFacets).toHaveLength(6);
        expect(result.failures).toEqual([]);
        expect(assess({kind: 'selection', labels: [...labels, Scope.NumbersWithZero]}).failures)
            .toEqual([expect.objectContaining({code: 'contradiction'})]);
        expect(assess({kind: 'selection', labels: []}).status).toBe('invalid_context');
    });

    it('cannot suppress completeness with a stale or evidence-bearing precomputed evaluation', () => {
        const annotations = labels.filter(label => label !== Scope.Base10);
        const stale = {...input({labels: annotations}), evaluation: {...evaluator.evaluate(labels),
            assessments: [], evidenceErrors: ['Broken optional adapter.']}};
        expect(assessLabelDependencyCoverage(stale).failures)
            .toEqual([expect.objectContaining({code: 'missing', facet: 'base'})]);
    });

    it('throws a dedicated annotation error that bypasses generation retries', () => {
        expect(assertLabelDependencyCoverage(input())).toEqual(assess());
        try {
            assertLabelDependencyCoverage(input({labels: labels.filter(label => label !== Scope.Base10)}), 'sample x');
            expect.unreachable();
        } catch (error) {
            expect(error).toBeInstanceOf(LabelDependencyCoverageError);
            expect(error).toBeInstanceOf(ResolvedLabelContractError);
            expect((error as Error).message).toContain('sample x: LD-NUM-01/base');
        }
        expect(() => assertLabelDependencyCoverage(input({labels: []}))).toThrow('artifact:');
    });
});

describe('strict annotation report summary', () => {
    const subject = (id: string, extra: Partial<LabelDependencyCoverageInput> = {}) => {
        const base = input(extra);
        return {...base, kind: base.kind ?? 'sample' as const, id, targetId: 'target',
            evidence: base.evidence ?? {triggers: {}, facets: {}, adapter: 'uncovered'},
            evaluation: evaluator.evaluate(base.labels, undefined, base.resolvedAreas)};
    };
    const dataset = {status: 'available', generationId: 'immutable-generation'};

    it('counts every eligible sample as checked and distinguishes pre-draw selections', () => {
        const subjects = [subject('valid'), subject('invalid', {labels: []}), subject('outside', {labels: [Area.EquationSolving]}),
            subject('new-producer', {generatorId: 'new'}), subject('selection', {kind: 'selection', labels: [Area.Addition, Scope.IntegerNumbers]})];
        const result = summarizeLabelDependencyCoverage({dataset, subjects, selection_coverage: []});
        expect(result.counts).toMatchObject({checked: 3, samples_checked: 2, selections_checked: 1,
            outside_policy_scope: 1, invalid_context: 1, checked_facets: 14, report_only_facets: 8});
        expect(result.failures).toContainEqual(expect.objectContaining({subject: 'invalid', code: 'context'}));
        expect(result.coverage_hash).toBe(LABEL_DEPENDENCY_COVERAGE_HASH);
        expect(result.report_only_facets).toEqual(['range']);
        expect(result.report_only_completeness_kinds).toEqual(['selection']);
        expect(summarizeLabelDependencyCoverage({dataset, subjects: [...subjects].reverse(), selection_coverage: []})).toEqual(result);
    });

    it('fails unavailable snapshots and incomplete selection enumeration independently of annotations', () => {
        const coverage = {targetId: 'target', generatorId: 'unknown', viewId: 'unknown', total: '5000', checked: 0};
        const result = summarizeLabelDependencyCoverage({dataset: {status: 'unavailable', generationId: null}, subjects: [],
            selection_coverage: [{...coverage, status: 'limit_exceeded', reason: 'Enumeration exceeds bound.'},
                {...coverage, status: 'invalid_plan'}, {...coverage, status: 'complete'}]});
        expect(result.failures.map(failure => failure.code)).toEqual(['dataset', 'enumeration', 'enumeration']);
        expect(result.counts.failures).toBe(3);
    });

    it('requires an immutable generation id and at least one stored sample', () => {
        expect(summarizeLabelDependencyCoverage({dataset: {...dataset, generationId: null}, subjects: [subject('valid')],
            selection_coverage: []}).failures).toEqual([
            {subject: 'dataset', code: 'dataset', message: 'No immutable dataset snapshot is available.'}
        ]);
        expect(summarizeLabelDependencyCoverage({dataset, subjects: [], selection_coverage: []}).failures).toEqual([
            {subject: 'dataset', code: 'dataset', message: 'No stored samples are available for dependency validation.'}
        ]);
    });
});
