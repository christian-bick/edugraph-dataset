import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts/generated';
import {labelDependencyCoverage} from '../validation/label-dependency-coverage.ts';
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

    it.each([
        ['fraction', [Scope.FractionNumbers, Scope.ProperFractions]],
        ['decimal', [Scope.DecimalNumbers]],
        ['mixed integer/decimal/fraction', [Scope.IntegerNumbers, Scope.DecimalNumbers, Scope.FractionNumbers, Scope.ProperFractions]],
        ['mixed integer/decimal/rational', [Scope.IntegerNumbers, Scope.DecimalNumbers, Scope.RationalNumbers]]
    ])('does not enforce operand digits on finalized %s annotations', (_name, kinds) => {
        const annotations = [...labels.filter(label => label !== Scope.IntegerNumbers
            && label !== Scope.SingleDigitSmallestOperand && label !== Scope.SingleDigitLargestOperand), ...kinds];
        const original = [...annotations];
        const result = assess({labels: annotations});
        expect(result.status).toBe('checked');
        expect(result.completenessEnforced).toBe(true);
        expect(result.failures).toEqual([]);
        expect(result.checkedFacets).toContain('LD-OPERANDS-01/operandCount');
        expect(result.checkedFacets.some(facet => facet.endsWith('/operandDigits'))).toBe(false);
        expect(result.reportOnlyFacets).toEqual(['LD-NUM-01/range']);
        expect(annotations).toEqual(original);
    });

    it.each([Scope.DecimalNumbers, Scope.TenthDecimals, Scope.HundredthDecimals, Scope.ThousandthDecimals])(
        'enforces integer widths alongside finalized decimal representation %s', representation => {
            const annotations = [...labels.filter(label => label !== Scope.SingleDigitSmallestOperand
                && label !== Scope.SingleDigitLargestOperand), representation];
            const original = [...annotations];
            const result = assess({labels: annotations});
            expect(result.failures).toEqual([
                expect.objectContaining({ruleId: 'LD-OPERANDS-02', code: 'missing', facet: 'operandDigits'})
            ]);
            expect(() => assertLabelDependencyCoverage(input({labels: annotations})))
                .toThrow(LabelDependencyCoverageError);
            expect(assess({labels: [...annotations, Scope.TwoDigitSmallestOperand]}).failures).toEqual([]);
            expect(result.reportOnlyFacets).toEqual(['LD-NUM-01/range']);
            expect(annotations).toEqual(original);
        });

    it('does not accept a broad operand role group as the missing width value', () => {
        const annotations = labels.filter(label => label !== Scope.SingleDigitSmallestOperand
            && label !== Scope.SingleDigitLargestOperand).concat(Scope.LargestOperandDigitCount);
        expect(assess({labels: annotations}).failures)
            .toEqual([expect.objectContaining({ruleId: 'LD-OPERANDS-02', code: 'missing', facet: 'operandDigits'})]);
    });

    it('enforces new producer/view combinations identically to existing reviewed projections', () => {
        const omitted = {labels: labels.filter(label => label !== Scope.Base10)};
        expect(assess(omitted).failures).toEqual(assess({...omitted,
            generatorId: 'arithmetic-ops-pairs', viewId: 'operations-boxes'}).failures);
    });

    it.each([
        [Scope.NumbersWithZero, 'zero'], [Scope.NumbersWithNegatives, 'sign']
    ])('rejects contradictory %s annotations for an unreviewed producer', (opposite, facet) => {
        expect(assess({labels: [...labels, opposite]}).failures).toEqual([
            expect.objectContaining({code: 'contradiction', facet})
        ]);
    });

    it('checks frame conflicts without any numeric trigger', () => {
        expect(assess({labels: [Area.Addition, Scope.SingleFrameOfReference, Scope.MultipleFramesOfReference]}).failures)
            .toEqual([expect.objectContaining({code: 'contradiction', facet: 'referenceFrames'})]);
    });

    it('permits mixed operand counts and fraction classifications describing different expressions', () => {
        expect(assess({labels: [...labels, Scope.ThreeOperands, Scope.FourOperands,
            Scope.ProperFractions, Scope.ImproperFractions, Scope.UnitFractions, Scope.NonUnitFractions]}).failures).toEqual([]);
    });

    it('enforces exhaustive fraction/decimal dependencies without unsupported refinements', () => {
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

    it('reports pre-draw completeness while enforcing finalized artifacts', () => {
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

    it('cannot suppress completeness with a stale precomputed evaluation', () => {
        const annotations = labels.filter(label => label !== Scope.Base10);
        const stale = {...input({labels: annotations}), evaluation: {...evaluator.evaluate(labels),
            assessments: []}};
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
            evaluation: evaluator.evaluate(base.labels, base.resolvedAreas)};
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
