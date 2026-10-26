import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts/generated';
import {labelDependencyCoverage} from '../validation/label-dependency-coverage.ts';
import {assessLabelDependencyEvidence} from './label-dependency-evidence.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import {ResolvedLabelContractError} from './label-contracts.ts';
import {assessLabelDependencyCoverage, assertLabelDependencyCoverage, classifyLabelDependencyVariant,
    hasLabelDependencyCoverage, LABEL_DEPENDENCY_COVERAGE_HASH, LabelDependencyCoverageError, summarizeLabelDependencyCoverage,
    type LabelDependencyCoverageInput} from './label-dependency-coverage.ts';

const evaluator = createLabelDependencyEvaluator();
const data = {num1: 2, num2: 3, answer: 5, operation: 'addition'};
const labels: string[] = [Area.Addition, Scope.IntegerNumbers, Scope.ArabicNumerals, Scope.Base10,
    Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero, Scope.TwoOperands,
    Scope.SingleDigitSmallestOperand, Scope.SingleDigitLargestOperand];
function input(extra: Partial<LabelDependencyCoverageInput> = {}): LabelDependencyCoverageInput {
    const producer = {generatorId: 'arithmetic-ops-pairs', viewId: 'operations-boxes', mode: 'question', data, ...extra};
    return {...producer, labels, evidence: assessLabelDependencyEvidence({...producer,
        mode: producer.mode === 'solution' ? 'solution' : 'question'}), ...extra};
}
const assess = (extra: Partial<LabelDependencyCoverageInput> = {}) => assessLabelDependencyCoverage(input(extra));
const lawData = {num1: 2, num2: 3, num3: 4, answer: 24, operation: 'multiplication', propertyLaw: 'commutative'};

describe('explicit dependency coverage classification', () => {
    it.each([
        ['arithmetic-ops-pairs', 'operations-boxes', data, 'integer-equation/nonnegative'],
        ['arithmetic-ops-triples', 'operations-vertical', {...data, num3: 4, answer: 9}, 'integer-equation/nonnegative'],
        ['arithmetic-ops-four', 'operations-boxes', {...data, num3: 4, num4: 5, answer: 14}, 'integer-equation/nonnegative'],
        ['counting-basic', 'counting-objects-simple', {numObjects: 3}, 'object-counting'],
        ['counting-selection', 'counting-objects-count-out', {numObjects: 3}, 'count-out'],
        ['unknown', 'operations-boxes', data, 'uncovered'],
        ['arithmetic-ops-pairs', 'operations-number-line-arithmetic', data, 'uncovered'],
        ['arithmetic-ops-pairs', 'operations-boxes', null, 'unresolved-payload'],
        ['arithmetic-ops-pairs', 'operations-boxes', [], 'unresolved-payload'],
        ['arithmetic-ops-pairs', 'operations-boxes', {}, 'unresolved-payload'],
        ['arithmetic-ops-pairs', 'operations-boxes', {...data, num2: Infinity}, 'unresolved-payload'],
        ['counting-basic', 'counting-objects-simple', {numObjects: '3'}, 'unresolved-payload'],
        ['arithmetic-ops-pairs', 'operations-boxes', {...data, propertyLaw: 'commutative'}, 'unresolved-payload'],
        ['arithmetic-ops-triples', 'operations-boxes', {...lawData, propertyLaw: 'unknown'}, 'unresolved-payload'],
        ['arithmetic-ops-pairs', 'operations-boxes', {...data, num1: -2, answer: 1}, 'integer-equation/signed']
    ])('classifies %s / %s without interpreting arbitrary fields', (generatorId, viewId, data, expected) => {
        expect(classifyLabelDependencyVariant({generatorId, viewId, data, mode: 'question'})).toBe(expected);
    });

    it.each(['commutative', 'associative', 'distributive'])('declares %s property profiles separately', propertyLaw => {
        const base = {generatorId: 'arithmetic-ops-triples', viewId: 'operations-boxes-inversion', mode: 'question'};
        expect(classifyLabelDependencyVariant({...base, data: {...lawData, propertyLaw}})).toBe(`property-${propertyLaw}/nonnegative`);
        expect(classifyLabelDependencyVariant({...base, data: {...lawData, propertyLaw, num1: -2}})).toBe(`property-${propertyLaw}/signed`);
        expect(classifyLabelDependencyVariant({...base, data: {...lawData, propertyLaw, num1: 0}})).toBe(`property-${propertyLaw}/underdetermined`);
        expect(classifyLabelDependencyVariant({...base, mode: 'solution', data: {...lawData, propertyLaw, num1: 0}})).toBe(`property-${propertyLaw}/nonnegative`);
    });

    it('uses the actual distributive coefficient rather than a zero addend', () => {
        const base = {generatorId: 'arithmetic-ops-triples', viewId: 'operations-vertical-inversion', mode: 'question'};
        expect(classifyLabelDependencyVariant({...base, data: {...lawData, propertyLaw: 'distributive', num3: 0}})).toBe('property-distributive/nonnegative');
        expect(classifyLabelDependencyVariant({...base, data: {...lawData, propertyLaw: 'associative', num3: 0}})).toBe('property-associative/underdetermined');
    });

    it('recognizes division observability without treating a sampled blank zero as a zero coefficient', () => {
        const base = {generatorId: 'arithmetic-ops-pairs', viewId: 'operations-boxes-inversion', mode: 'question'};
        expect(classifyLabelDependencyVariant({...base, data: {...data, operation: 'division', num1: 0}})).toBe('integer-equation/underdetermined');
        expect(classifyLabelDependencyVariant({...base, data: {...data, operation: 'multiplication', num2: 0}})).toBe('integer-equation/nonnegative');
        expect(classifyLabelDependencyVariant({...base, data: {...data, num1: 0}})).toBe('integer-equation/nonnegative');
        expect(classifyLabelDependencyVariant({...base, viewId: 'operations-boxes', data: {...data, operation: 'multiplication', num1: 0}})).toBe('integer-equation/nonnegative');
    });

    it.each(['toString', 'constructor', '__proto__'])('does not register inherited object key %s as a generator', generatorId => {
        expect(hasLabelDependencyCoverage(generatorId, 'operations-boxes')).toBe(false);
        expect(classifyLabelDependencyVariant({generatorId, viewId: 'operations-boxes', mode: 'question', data})).toBe('uncovered');
    });

    it.each([{toString: 'commutative'}, {toString: () => 'commutative'}, 1, null])('never coerces a malformed property-law value', propertyLaw => {
        expect(classifyLabelDependencyVariant({generatorId: 'arithmetic-ops-triples', viewId: 'operations-boxes',
            mode: 'question', data: {...lawData, propertyLaw}})).toBe('unresolved-payload');
    });
});

describe('reviewed strict facet enforcement', () => {
    it('enforces complete non-range facts while retaining missing range as report-only', () => {
        const result = assess();
        expect(result.status).toBe('covered');
        expect(result.variant).toBe('integer-equation/nonnegative');
        expect(result.coveredFacets).toHaveLength(7);
        expect(result.uncoveredFacets).toContain('LD-NUM-01/range');
        expect(result.failures).toEqual([]);
        expect(result.coverageHash).toBe(LABEL_DEPENDENCY_COVERAGE_HASH);
        expect(result.coverageHash).toMatch(/^[a-f\d]{64}$/);
        expect(labelDependencyCoverage.reportOnlyFacets).toEqual(['range']);
    });

    it.each([
        [Scope.IntegerNumbers, 'numberKind'], [Scope.ArabicNumerals, 'numeralSystem'], [Scope.Base10, 'base'],
        [Scope.NumbersWithoutNegatives, 'sign'], [Scope.NumbersWithoutZero, 'zero'], [Scope.TwoOperands, 'operandCount'],
        [Scope.SingleDigitLargestOperand, 'operandDigits']
    ])('fails an omitted %s claim even if other supplied claims pass', (label, facet) => {
        expect(assess({labels: labels.filter(value => value !== label)}).failures).toEqual(expect.arrayContaining([
            expect.objectContaining({code: 'missing', facet})
        ]));
    });

    it('fails missing trigger evidence and missing covered assessments', () => {
        const base = input();
        const evaluation = evaluator.evaluate(base.labels, base.evidence);
        const result = assess({...base, evaluation: {...evaluation,
            triggers: evaluation.triggers.filter(trigger => trigger.ruleId !== 'LD-NUM-01'),
            assessments: evaluation.assessments.filter(assessment => assessment.facet !== 'base')}});
        expect(result.failures).toContainEqual(expect.objectContaining({code: 'trigger', ruleId: 'LD-NUM-01'}));
        expect(result.failures).toContainEqual(expect.objectContaining({code: 'unresolved', facet: 'base'}));
    });

    it('fails an unresolved applicable facet in otherwise supported evidence', () => {
        const base = input();
        const evidence = {...base.evidence, facets: {...base.evidence.facets, zero: {
            status: 'unresolved' as const, reason: 'No reliable zero evidence.', references: []
        }}};
        expect(assess({...base, evidence}).failures).toContainEqual(expect.objectContaining({code: 'unresolved', facet: 'zero'}));
    });

    it.each([
        [Scope.NumbersWithZero, 'zero'], [Scope.NumbersWithNegatives, 'sign']
    ])('rejects opposing %s claims without imposing one-of cardinality on unrelated facets', (opposite, facet) => {
        expect(assess({labels: [...labels, opposite]}).failures).toContainEqual(expect.objectContaining({code: 'contradiction', facet}));
    });

    it('permits several truthful operand cardinalities and digit profiles in a property witness', () => {
        const result = assess({generatorId: 'arithmetic-ops-triples', data: {num1: 2, num2: 3, num3: 4, answer: 14,
            operation: 'multiplication', propertyLaw: 'distributive', combinedFactor: 7, partialProducts: [6, 8]},
            labels: [...labels, Scope.ThreeOperands, Scope.FourOperands]});
        expect(result.variant).toBe('property-distributive/nonnegative');
        expect(result.failures).toEqual([]);
    });

    it('keeps unreviewed facets visible instead of claiming complete rule coverage', () => {
        const result = assess({labels: [...labels, Scope.ProperFractions]});
        expect(result.uncoveredFacets).toContain('LD-FRACTION-01/fractionMagnitude');
        expect(result.uncoveredRules).toContain('LD-FRAME-01');
        expect(result.failures).toEqual([]);
    });

    it('does not make unsupported projections fail ordinary unresolved assessments', () => {
        const result = assess({viewId: 'operations-number-line-arithmetic', labels: [Area.Addition, Scope.IntegerNumbers]});
        expect(result.status).toBe('uncovered');
        expect(result.coveredFacets).toEqual([]);
        expect(result.uncoveredFacets).toContain('LD-NUM-01/base');
        expect(result.failures).toEqual([]);
    });

    it('cannot silently drop enforcement when a registered producer loses its evidence adapter', () => {
        expect(hasLabelDependencyCoverage('arithmetic-ops-pairs', 'operations-boxes')).toBe(true);
        expect(hasLabelDependencyCoverage('arithmetic-ops-pairs', 'unknown')).toBe(false);
        const unavailable = assessLabelDependencyEvidence({generatorId: 'unknown', viewId: 'unknown', mode: 'question'});
        const result = assess({evidence: unavailable});
        expect(result.status).toBe('covered');
        expect(result.failures).toContainEqual(expect.objectContaining({code: 'unresolved', facet: 'zero'}));
    });

    it('never shrinks the Area allowlist to obtain passing evidence', () => {
        const outside = assess({labels: [Area.Addition, Area.EquationSolving, Scope.NumbersWithZero, Scope.NumbersWithoutZero]});
        expect(outside.status).toBe('outside_policy_scope');
        expect(outside.failures).toEqual([]);
        expect(assess({labels: [...labels, Area.AlgebraicExpression]}).status).toBe('covered');
        const invalid = assess({labels: []});
        expect(invalid.status).toBe('invalid_context');
        expect(invalid.failures).toContainEqual(expect.objectContaining({code: 'context'}));
    });

    it('preserves explicit resolved Areas when checking the gate', () => {
        expect(assess({resolvedAreas: [Area.EquationSolving]}).status).toBe('outside_policy_scope');
    });

    it('keeps structural/provenance failures strict even for unreviewed or outside contexts', () => {
        const result = assess({generatorId: 'unknown', labels: [Area.EquationSolving],
            issues: ['stale source', 'stale source'], replay: 'unresolved'});
        expect(result.status).toBe('outside_policy_scope');
        expect(result.failures.map(failure => failure.code)).toEqual(['evidence', 'replay']);
        expect(assess({labels: [...labels, 'http://edugraph.io/edu/Unknown']} ).failures)
            .toContainEqual(expect.objectContaining({code: 'contract'}));
    });

    it('requires reviewed stored rows to have verified replay', () => {
        expect(assess({replay: 'unsupported'}).failures).toContainEqual(expect.objectContaining({code: 'replay'}));
        expect(assess({replay: 'verified'}).failures).toEqual([]);
    });

    it.each(['unresolved-payload', 'integer-equation/unknown', 'count-out', 'unknown'])('fails unsupported variant %s for a reviewed pair', coverageVariant => {
        expect(assess({coverageVariant}).failures).toContainEqual(expect.objectContaining({code: 'coverage'}));
    });

    it('rejects an arithmetic variant falsely supplied for counting', () => {
        expect(assess({generatorId: 'counting-basic', viewId: 'counting-objects-simple', data: {numObjects: 3, simpleAnswer: 3},
            coverageVariant: 'integer-equation/nonnegative'}).failures).toContainEqual(expect.objectContaining({code: 'coverage'}));
    });

    it('does not accept a forged easier profile when payload data is available', () => {
        expect(assess({coverageVariant: 'integer-equation/signed'}).failures).toContainEqual(expect.objectContaining({
            code: 'coverage', message: 'Declared coverage variant disagrees with the mathematical payload.'
        }));
    });

    it('permits replay-bound variants without serializing mathematical payloads into the report', () => {
        expect(assess({...input(), data: undefined, coverageVariant: 'integer-equation/nonnegative', replay: 'verified'}).failures).toEqual([]);
        expect(assess({mode: undefined, coverageVariant: 'integer-equation/nonnegative'}).failures).toEqual([]);
        expect(assess({mode: undefined}).failures).toEqual([]);
    });

    it('requires provenance for a supplied variant without a mathematical payload', () => {
        expect(assess({...input(), data: undefined, coverageVariant: 'integer-equation/nonnegative'}).failures)
            .toContainEqual(expect.objectContaining({code: 'coverage', message: 'A stored coverage variant requires verified replay when no mathematical payload is supplied.'}));
    });

    it('does not allow an underdetermined profile in a solved artifact or ordinary projection', () => {
        for (const extra of [{mode: 'solution'}, {viewId: 'operations-boxes'}]) {
            expect(assess({...extra, data: undefined, coverageVariant: 'integer-equation/underdetermined'}).failures)
                .toContainEqual(expect.objectContaining({code: 'coverage'}));
        }
    });

    it('keeps signed digit profiles explicitly deferred while enforcing their established values', () => {
        const omitted = new Set<string>([Scope.NumbersWithoutNegatives, Scope.SingleDigitSmallestOperand, Scope.SingleDigitLargestOperand]);
        const result = assess({data: {...data, num1: -2, answer: 1}, labels: labels.filter(label => !omitted.has(label))
                .concat(Scope.NumbersWithNegatives)});
        expect(result.deferredFacets).toEqual(['LD-OPERANDS-01/operandDigits']);
        expect(result.coveredFacets).toContain('LD-NUM-01/zero');
        expect(result.failures).toEqual([]);
    });

    it('defers hidden underdetermined values without weakening notation or structure checks', () => {
        const result = assess({viewId: 'operations-boxes-inversion', data: {...data, num1: 0, answer: 0, operation: 'multiplication'},
            labels: [Area.Multiplication, Scope.ArabicNumerals, Scope.Base10, Scope.TwoOperands]});
        expect(result.variant).toBe('integer-equation/underdetermined');
        expect(result.coveredFacets).toEqual(['LD-NUM-01/base', 'LD-NUM-01/numeralSystem', 'LD-OPERANDS-01/operandCount']);
        expect(result.deferredFacets).toHaveLength(4);
        expect(result.failures).toEqual([]);
    });

    it('enforces a written explanation for the reviewed simple-counting projection', () => {
        const base = {generatorId: 'counting-basic', viewId: 'counting-objects-simple', data: {numObjects: 3, simpleAnswer: 3},
            labels: [Area.NumerationWithIntegers, ...labels.filter(label => label !== Area.Addition)]};
        expect(assess(base).failures).toContainEqual(expect.objectContaining({facet: 'articulation', code: 'missing'}));
        expect(assess({...base, labels: [...base.labels, Ability.TextualArticulation]}).failures).toEqual([]);
    });

    it('accepts evidenced inapplicability of numeral system and base in object conservation', () => {
        const result = assess({generatorId: 'counting-basic', viewId: 'counting-conservation', data: {numObjects: 3, simpleAnswer: 3},
            labels: labels.filter(label => label !== Scope.ArabicNumerals && label !== Scope.Base10)});
        expect(result.failures).toEqual([]);
    });

    it('accepts the declared count-out variant', () => {
        expect(assess({generatorId: 'counting-selection', viewId: 'counting-objects-count-out',
            data: {numObjects: 3, simpleAnswer: 3, availableCount: 5}}).failures).toEqual([]);
    });

    it.each(['operations-boxes', 'counting-objects-simple', 'counting-conservation'])('defers data-dependent selection coverage for %s', viewId => {
        const generatorId = viewId === 'operations-boxes' ? 'arithmetic-ops-pairs' : 'counting-basic';
        const result = assess({generatorId, viewId, kind: 'selection', data: undefined, labels: [Area.Addition, Scope.IntegerNumbers]});
        expect(result.status).toBe('deferred');
        expect(result.coveredFacets).toEqual([]);
        expect(result.deferredFacets).toContain('LD-NUM-01/zero');
        expect(result.deferredFacets.includes('LD-EXPLAIN-01/articulation')).toBe(viewId === 'counting-objects-simple');
        expect(result.failures).toEqual([]);
    });

    it('throws a dedicated annotation contract error that bypasses retries', () => {
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

describe('strict report coverage summary', () => {
    const subject = (id: string, extra: Partial<LabelDependencyCoverageInput> = {}) => {
        const base = input(extra);
        return {...base, kind: base.kind ?? 'sample' as const, id, targetId: 'target',
            evaluation: evaluator.evaluate(base.labels, base.evidence, base.resolvedAreas)};
    };
    const dataset = {status: 'available', generationId: 'immutable-generation'};
    it('reports passing, deferred, uncovered, outside, and invalid coverage separately and deterministically', () => {
        const subjects = [subject('valid'), subject('invalid', {labels: []}), subject('outside', {labels: [Area.EquationSolving]}),
            subject('uncovered', {generatorId: 'unknown'}), subject('selection', {kind: 'selection', data: undefined})];
        const result = summarizeLabelDependencyCoverage({dataset, subjects, selection_coverage: []});
        expect(result.counts).toMatchObject({covered: 1, deferred: 1, uncovered: 1, outside_policy_scope: 1, invalid_context: 1});
        expect(result.failures).toContainEqual(expect.objectContaining({subject: 'invalid', code: 'context'}));
        expect(result.coverage_hash).toBe(LABEL_DEPENDENCY_COVERAGE_HASH);
        expect(result.report_only_facets).toEqual(['range']);
        expect(summarizeLabelDependencyCoverage({dataset, subjects: [...subjects].reverse(), selection_coverage: []})).toEqual(result);
    });

    it('fails unavailable datasets and incomplete selection enumeration even if no missing label was sampled', () => {
        const coverage = {targetId: 'target', generatorId: 'unknown', viewId: 'unknown', total: '5000', checked: 0};
        const result = summarizeLabelDependencyCoverage({dataset: {status: 'unavailable', generationId: null}, subjects: [],
            selection_coverage: [{...coverage, status: 'limit_exceeded', reason: 'Enumeration exceeds bound.'},
                {...coverage, status: 'invalid_plan'}, {...coverage, status: 'complete'}]});
        expect(result.failures.map(failure => failure.code)).toEqual(['dataset', 'enumeration', 'enumeration']);
        expect(result.counts.failures).toBe(3);
    });

    it('fails a missing immutable generation id and normalizes absent subject modes', () => {
        const result = summarizeLabelDependencyCoverage({dataset: {status: 'available', generationId: null},
            subjects: [subject('without-mode', {mode: undefined})], selection_coverage: []});
        expect(result.failures).toEqual([{subject: 'dataset', code: 'dataset', message: 'No immutable dataset snapshot is available.'}]);
    });

    it('cannot claim passing artifact validation for an empty immutable snapshot', () => {
        expect(summarizeLabelDependencyCoverage({dataset, subjects: [], selection_coverage: []}).failures)
            .toEqual([{subject: 'dataset', code: 'dataset', message: 'No stored samples are available for dependency validation.'}]);
    });
});
