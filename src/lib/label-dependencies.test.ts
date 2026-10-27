import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope, bundledContext} from 'edugraph-ts/generated';
import {createOntologyContext, RELATION_IRIS, type OntologyStatement} from 'edugraph-ts/core';
import {labelDependencies} from '../validation/label-dependencies.ts';
import {dependencyEvidenceIds, type DependencyEvidenceId, type DependencyTriggerEvidence, type DependencyFacetEvidence, type LabelDependencyEvidence,
    type LabelDependencyGraph} from '../types/label-dependencies.ts';
import {createLabelDependencyEvaluator, validateLabelDependencyGraph} from './label-dependencies.ts';

const evaluator = createLabelDependencyEvaluator();
const graph = (): LabelDependencyGraph => structuredClone(labelDependencies);
const applicable = (expectedLabels: readonly string[]): DependencyFacetEvidence => ({
    status: 'applicable', expectedLabels, reason: 'Established by the task.', references: ['problem.data']
});
type MutableEvidence = Omit<LabelDependencyEvidence, 'triggers'>
    & {triggers: Partial<Record<DependencyEvidenceId, DependencyTriggerEvidence>>};
const evidence = (facets: LabelDependencyEvidence['facets'] = {}): MutableEvidence => ({
    adapter: 'fixture-v1', facets,
    triggers: Object.fromEntries(dependencyEvidenceIds.map(id => [id,
        {status: 'absent', reason: 'The task does not contain this feature.', references: ['fixture.task']}]))
});
const assessment = (labels: readonly string[], facet: string, proof?: LabelDependencyEvidence) =>
    evaluator.evaluate(labels, proof ?? {adapter: 'uncovered', triggers: {}, facets: {}})
        .evidenceAssessments!.find(item => item.facet === facet)!;

describe('label dependency context gate', () => {
    it.each([Area.Addition, Area.NumericOrder, Area.Equation])('admits descendants of each allowed root: %s', area => {
        expect(evaluator.evaluate([area]).context.status).toBe('eligible');
    });

    it('uses every resolved Area and accepts the intended algebraic-expression arithmetic context', () => {
        expect(evaluator.evaluate([Area.AlgebraicExpression, Area.Addition, Area.Equation]).context).toEqual({
            status: 'eligible', areas: [Area.Addition, Area.AlgebraicExpression, Area.Equation].sort(), outsideAreas: []
        });
        for (const outside of [Area.EquationSolving, Area.AlgebraicModeling]) {
            const result = evaluator.evaluate([Area.AlgebraicExpression, Area.Addition, outside]);
            expect(result.context.status).toBe('outside_policy_scope');
            expect(result.context.outsideAreas).toEqual([outside]);
            expect(result.assessments).toEqual([]);
        }
    });

    it('rejects empty, unknown, and ineligible label sets even when an outside Area is present', () => {
        expect(evaluator.evaluate([]).context.status).toBe('invalid_context');
        expect(evaluator.evaluate([Scope.IntegerNumbers]).errors).toContain('At least one resolved Area is required.');
        const result = evaluator.evaluate([Area.EquationSolving, 'unknown', Area.Arithmetic]);
        expect(result.context.status).toBe('invalid_context');
        expect(result.errors).toEqual([`Ineligible descriptor '${Area.Arithmetic}'.`, "Unknown descriptor 'unknown'."]);
    });

    it('does not activate obligations merely because the context gate passes', () => {
        const result = evaluator.evaluate([Area.Equation], evidence());
        expect(result.context.status).toBe('eligible');
        expect(result.assessments).toEqual([]);
        expect(result.triggers.every(trigger => trigger.status === 'absent')).toBe(true);
    });

    it('records unknown evidence triggers as unresolved without fabricating activation', () => {
        const result = evaluator.evaluate([Area.Equation], {adapter: 'uncovered', triggers: {}, facets: {}});
        expect(result.triggers.every(trigger => trigger.status === 'absent')).toBe(true);
        expect(result.evidenceTriggers!.every(trigger => trigger.status === 'unresolved')).toBe(true);
        expect(result.assessments).toEqual([]);
        const malformed = evidence();
        malformed.triggers.numericTask = {status: 'present', reason: '', references: []};
        expect(evaluator.evaluate([Area.Equation], malformed).evidenceTriggers!.find(item => item.ruleId === 'LD-NUM-01')!.status)
            .toBe('unresolved');
    });

    it('uses authoritative resolved Areas for stored-row context without adding annotation claims', () => {
        const labels = [Area.Addition, Scope.IntegerNumbers];
        const outside = evaluator.evaluate(labels, undefined, [Area.EquationSolving]);
        expect(outside.context.status).toBe('outside_policy_scope');
        const allowed = evaluator.evaluate(labels, undefined, [Area.Equation]);
        expect(allowed.context.areas).toEqual([Area.Addition, Area.Equation]);
        expect(allowed.assessments.flatMap(item => item.labels)).not.toContain(Area.Equation);
        expect(evaluator.evaluate(labels, undefined, [Scope.Base10]).errors)
            .toContain(`Resolved context label '${Scope.Base10}' is not an Area.`);
        expect(labels).toEqual([Area.Addition, Scope.IntegerNumbers]);
    });
});

describe('label dependency assessments', () => {
    it('activates numeric obligations from eligible structural-family members without adding labels', () => {
        const labels = [Area.Addition, Scope.IntegerNumbers];
        const before = [...labels];
        const result = evaluator.evaluate(labels);
        expect(result.triggers.find(trigger => trigger.ruleId === 'LD-NUM-01')).toEqual({
            ruleId: 'LD-NUM-01', status: 'present', labels: [Scope.IntegerNumbers], evidence: []
        });
        expect(result.assessments).toHaveLength(6);
        expect(assessment(labels, 'base').status).toBe('unresolved');
        expect(labels).toEqual(before);
    });

    it('detects missing dependencies even after every numeric trigger label is removed', () => {
        const proof = evidence({numberKind: applicable([Scope.IntegerNumbers])});
        proof.triggers.numericTask = {status: 'present', reason: 'Arithmetic values are present.', references: ['data.num1']};
        const result = assessment([Area.Addition], 'numberKind', proof);
        expect(result.status).toBe('missing');
        expect(result.missingLabels).toEqual([Scope.IntegerNumbers]);
    });

    it('checks all independently expected claims and permits mixed labels', () => {
        const proof = evidence({numeralSystem: applicable([Scope.ArabicNumerals, Scope.RomanNumerals])});
        expect(assessment([Area.Addition, Scope.IntegerNumbers, Scope.ArabicNumerals], 'numeralSystem', proof))
            .toMatchObject({status: 'missing', missingLabels: [Scope.RomanNumerals]});
        expect(assessment([Area.Addition, Scope.IntegerNumbers, Scope.ArabicNumerals, Scope.RomanNumerals], 'numeralSystem', proof).status)
            .toBe('satisfied');
    });

    it('allows ontology specialization in expected-label proofs without inferring an annotation', () => {
        const proof = evidence({numberKind: applicable([Scope.RealNumbers])});
        expect(assessment([Area.Addition, Scope.IntegerNumbers], 'numberKind', proof).status).toBe('satisfied');
        expect(assessment([Area.Addition, Scope.RealNumbers], 'numberKind', evidence({numberKind: applicable([Scope.IntegerNumbers])})).status)
            .toBe('missing');
    });

    it('requires family presence for applicability assessments that do not specify an exact label', () => {
        const proof = evidence({base: applicable([])});
        expect(assessment([Area.Addition, Scope.IntegerNumbers], 'base', proof).status).toBe('missing');
        expect(assessment([Area.Addition, Scope.IntegerNumbers, Scope.Base10], 'base', proof).status).toBe('satisfied');
    });

    it('retains unresolved evidence even when a label from that facet is already present', () => {
        const proof = evidence({base: {status: 'unresolved', reason: 'The representation is not established.', references: []}});
        expect(assessment([Area.Addition, Scope.Base10], 'base', proof)).toMatchObject({
            status: 'unresolved', labels: [Scope.Base10], reason: 'The representation is not established.'
        });
    });

    it('accepts evidence-backed inapplicability for object-only numeral and base facets', () => {
        const na: DependencyFacetEvidence = {status: 'not_applicable', reason: 'Only objects and word choices.', references: ['view.task']};
        const proof = evidence({numeralSystem: na, base: na});
        expect(assessment([Area.NumericOrder, Scope.IntegerNumbers], 'base', proof).status).toBe('not_applicable');
        expect(assessment([Area.NumericOrder, Scope.IntegerNumbers], 'numeralSystem', proof).status).toBe('not_applicable');
    });

    it('rejects unsupported inapplicability and applicability receipts', () => {
        const labels = [Area.Addition, Scope.IntegerNumbers];
        expect(assessment(labels, 'base', evidence({base: {status: 'not_applicable', reason: '', references: []}})).status)
            .toBe('unresolved');
        expect(assessment(labels, 'base', evidence({base: {status: 'applicable', reason: 'No references.', references: []}})).status)
            .toBe('unresolved');
        const proof = evidence({base: {status: 'not_applicable', reason: 'No notation.', references: ['view.task']}});
        const result = evaluator.evaluate([...labels, Scope.Base10], proof);
        expect(result.evidenceErrors).toContain('LD-NUM-01/base: inapplicability conflicts with supplied or expected labels.');
        expect(result.evidenceAssessments!.find(item => item.facet === 'base')!.status).toBe('unresolved');
        expect(evaluator.evaluate(labels, evidence({base: {...proof.facets.base, expectedLabels: [Scope.Base10]}})).evidenceErrors).toHaveLength(1);
    });

    it('reports invalid expected descriptors rather than accepting them as evidence', () => {
        for (const label of ['unknown', Area.Addition, Scope.NumericAbstraction]) {
            const result = evaluator.evaluate([Area.Addition, Scope.IntegerNumbers], evidence({base: applicable([label])}));
            expect(result.evidenceErrors![0]).toContain('expected labels are unknown, ineligible, or outside the facet');
            expect(result.evidenceAssessments!.find(item => item.facet === 'base')!.status).toBe('unresolved');
        }
    });

    it('limits range assessment to existing label presence and preserves composed bounds', () => {
        const labels = [Area.Addition, Scope.NumbersLarger10, Scope.NumbersSmaller1000];
        const proof = evidence({range: applicable([Scope.NumbersSmaller20])});
        const result = assessment(labels, 'range', proof);
        expect(result.status).toBe('satisfied');
        expect(result.labels).toEqual([Scope.NumbersLarger10, Scope.NumbersSmaller1000].sort());
        expect(result.expectedLabels).toEqual([]);
        expect(result.missingLabels).toEqual([]);
        expect(assessment([Area.Addition, Scope.IntegerNumbers], 'range').status).toBe('missing');
        expect(labels).toEqual([Area.Addition, Scope.NumbersLarger10, Scope.NumbersSmaller1000]);
    });

    it('activates fraction/decimal rules from family labels and role/frame/explanation rules from evidence', () => {
        const proof = evidence({
            fractionMagnitude: applicable([Scope.ProperFractions]), fractionUnit: applicable([Scope.NonUnitFractions]),
            decimalPrecision: applicable([Scope.HundredthDecimals]),
            articulation: applicable([Ability.TextualArticulation]), referenceFrames: applicable([Scope.SingleFrameOfReference]),
            operandCount: applicable([Scope.TwoOperands]), operandDigits: applicable([Scope.SingleDigitLargestOperand])
        });
        for (const id of ['arithmeticOperands', 'quantityReferenceFrames', 'writtenExplanation'] as const) {
            proof.triggers[id] = {status: 'present', reason: 'Observed task feature.', references: ['view.task']};
        }
        const result = evaluator.evaluate([Area.Addition, Scope.ProperFractions, Scope.DecimalNumbers], proof);
        expect(result.evidenceTriggers!.every(trigger => trigger.status === 'present')).toBe(true);
        expect(result.evidenceAssessments!.find(item => item.facet === 'fractionMagnitude')!.status).toBe('satisfied');
        expect(result.evidenceAssessments!.find(item => item.facet === 'articulation')!.missingLabels).toEqual([Ability.TextualArticulation]);
        expect(result.evidenceAssessments!.find(item => item.facet === 'referenceFrames')!.missingLabels).toEqual([Scope.SingleFrameOfReference]);
    });

    it('returns deterministic diagnostics for reordered/duplicated labels, facets, rules, and evidence', () => {
        const labels = [Scope.ArabicNumerals, Area.Addition, Scope.IntegerNumbers];
        const proof = evidence({base: applicable([Scope.Base10]), numberKind: applicable([Scope.IntegerNumbers])});
        expect(evaluator.evaluate(labels, proof)).toEqual(evaluator.evaluate([...labels].reverse().concat(labels[0]), proof));
        const reordered = graph();
        (reordered as any).rules = [...reordered.rules].reverse();
        (reordered as any).facets = Object.fromEntries(Object.entries(reordered.facets).reverse());
        const other = createLabelDependencyEvaluator(reordered);
        expect(other.policyHash).toBe(evaluator.policyHash);
        expect(other.evaluate(labels, proof)).toEqual(evaluator.evaluate(labels, proof));
    });

    it('binds immutable evaluated policy semantics even if the authored input object is later changed', () => {
        const value = graph();
        const bound = createLabelDependencyEvaluator(value);
        (value as any).context.allAreasWithin = [Area.Algebra];
        expect(bound.evaluate([Area.Addition]).context.status).toBe('eligible');
    });
});

describe('annotation-only dependency validation', () => {
    const core = (labels: readonly string[], proof?: LabelDependencyEvidence) => {
        const result = evaluator.evaluate([Area.Addition, ...labels], proof);
        return {triggers: result.triggers, assessments: result.assessments, errors: result.errors, conflicts: result.conflicts};
    };

    it('reports missing annotation families without an adapter or expected label value', () => {
        const result = core([Scope.IntegerNumbers]);
        expect(result.assessments.find(item => item.facet === 'base')).toMatchObject({
            status: 'missing', labels: [], expectedLabels: [], missingLabels: [], references: []
        });
        expect(result.assessments.find(item => item.facet === 'numberKind')!.status).toBe('satisfied');
        expect(result.assessments.every(item => ['missing', 'satisfied'].includes(item.status))).toBe(true);
    });

    it.each([undefined, {adapter: 'not-requested', triggers: {}, facets: {base: applicable([Scope.Base10])}}])(
        'does not fabricate supplementary unresolved findings when evidence was not requested', proof => {
            const result = evaluator.evaluate([Area.Addition, Scope.IntegerNumbers], proof);
            expect(result.evidenceTriggers).toEqual([]);
            expect(result.evidenceAssessments).toEqual([]);
            expect(result.evidenceErrors).toEqual([]);
            expect(result.assessments.find(item => item.facet === 'base')!.status).toBe('missing');
        });

    it.each([Scope.ArabicNumerals, Scope.TwoOperands, Scope.SingleDigitLargestOperand])(
        'recognizes numeric annotations outside the NumericAbstraction subtree: %s', label => {
            const result = core([label]);
            expect(result.triggers.find(item => item.ruleId === 'LD-NUM-01')!.status).toBe('present');
            expect(result.assessments.find(item => item.facet === 'numberKind')!.status).toBe('missing');
        });

    it.each([
        [Scope.TwoOperands, 'operandDigits'],
        [Scope.SingleDigitLargestOperand, 'operandCount']
    ])('requires the complementary operand annotation family for %s', (label, missing) => {
        expect(core([label]).assessments.find(item => item.facet === missing)!.status).toBe('missing');
    });

    it('does not activate operand, frame or explanation obligations solely from allowed Areas', () => {
        const result = core([]);
        expect(result.assessments).toEqual([]);
        expect(result.triggers.every(item => item.status === 'absent')).toBe(true);
    });

    it('keeps annotation completeness independent of applicable, absent and malformed evidence', () => {
        const labels = [Scope.IntegerNumbers, Scope.TwoOperands];
        const proofs = [undefined, evidence({base: applicable([Scope.Base10])}), evidence({base: {
            status: 'not_applicable', reason: 'Object-only projection.', references: ['view']
        }}), evidence({base: {status: 'unresolved', reason: 'Unsupported projection.', references: []}}),
        evidence({base: applicable(['unknown'])})];
        const expected = core(labels);
        for (const proof of proofs) expect(core(labels, proof)).toEqual(expected);
        expect(expected.errors).toEqual([]);
    });

    it('keeps evidence-only activation and omissions in the supplementary channel', () => {
        const proof = evidence({articulation: applicable([Ability.TextualArticulation]), base: applicable([Scope.Base10])});
        proof.triggers.writtenExplanation = {status: 'present', reason: 'A written justification is requested.', references: ['view']};
        proof.triggers.numericTask = {status: 'present', reason: 'Actual numeric content.', references: ['data']};
        const result = evaluator.evaluate([Area.Addition], proof);
        expect(result.assessments).toEqual([]);
        expect(result.evidenceAssessments!.find(item => item.facet === 'articulation')).toMatchObject({
            status: 'missing', missingLabels: [Ability.TextualArticulation]
        });
        expect(result.evidenceAssessments!.find(item => item.facet === 'base')!.missingLabels).toEqual([Scope.Base10]);
    });

    it.each([
        ['zero', Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        ['sign', Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
        ['referenceFrames', Scope.SingleFrameOfReference, Scope.MultipleFramesOfReference]
    ])('detects contradictory %s annotations without adapters', (facet, left, right) => {
        expect(core([left, right, left]).conflicts).toEqual([expect.objectContaining({facet, labels: [left, right].sort()})]);
        expect(core([left]).conflicts).toEqual([]);
        expect(evaluator.evaluate([Area.EquationSolving, left, right]).conflicts).toEqual([]);
    });

    it('permits mixed labels that are not declared mutually exclusive', () => {
        expect(core([Scope.IntegerNumbers, Scope.DecimalNumbers, Scope.ArabicNumerals, Scope.RomanNumerals,
            Scope.TwoOperands, Scope.FourOperands, Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand,
            Scope.ProperFractions, Scope.ImproperFractions, Scope.UnitFractions, Scope.NonUnitFractions]).conflicts).toEqual([]);
    });

    it('normalizes conflict declarations for deterministic diagnostics and policy identity', () => {
        const reordered = graph();
        (reordered as any).conflicts = [...reordered.conflicts!].reverse().map(rule => ({...rule, labels: [...rule.labels].reverse()}));
        const other = createLabelDependencyEvaluator(reordered);
        expect(other.policyHash).toBe(evaluator.policyHash);
        expect(other.evaluate([Area.Addition, Scope.NumbersWithZero, Scope.NumbersWithoutZero]))
            .toEqual(evaluator.evaluate([Area.Addition, Scope.NumbersWithZero, Scope.NumbersWithoutZero]));
        (reordered as any).conflicts = [];
        expect(createLabelDependencyEvaluator(reordered).policyHash).not.toBe(evaluator.policyHash);
    });

    it('accepts repeated trigger alternatives without duplicating a rule assessment', () => {
        const value = graph();
        (value as any).rules[0].when.any.push({family: 'numeric'});
        expect(createLabelDependencyEvaluator(value).evaluate([Area.Addition, Scope.IntegerNumbers]).assessments)
            .toEqual(evaluator.evaluate([Area.Addition, Scope.IntegerNumbers]).assessments);
    });

    it('does not turn duplicate conflict choices into false conflicts', () => {
        const value = graph();
        (value as any).conflicts[0].labels.push(value.conflicts![0].labels[0]);
        expect(createLabelDependencyEvaluator(value).evaluate([Area.Addition, Scope.NumbersWithZero]).conflicts).toEqual([]);
    });

    it('supports explicit candidate-family conflict declarations without making all families exclusive', () => {
        const value = graph();
        (value as any).facets.zero = {labels: [Scope.NumbersWithZero, Scope.NumbersWithoutZero]};
        const custom = createLabelDependencyEvaluator(value);
        expect(custom.evaluate([Area.Addition, Scope.NumbersWithZero, Scope.NumbersWithoutZero]).conflicts).toHaveLength(1);
    });
});

describe('graph integrity', () => {
    it('accepts organizational roots only as selectors and validates the authored graph', () => {
        expect(() => validateLabelDependencyGraph(labelDependencies)).not.toThrow();
    });

    it.each([
        ['version', (value: any) => {value.version = 2;}],
        ['unknown graph fields', (value: any) => {value.other = true;}],
        ['missing context', (value: any) => {delete value.context;}],
        ['empty roots', (value: any) => {value.context.allAreasWithin = [];}],
        ['requireArea false', (value: any) => {value.context.requireArea = false;}],
        ['unknown context fields', (value: any) => {value.context.primary = true;}],
        ['unknown roots', (value: any) => {value.context.allAreasWithin = ['unknown'];}],
        ['non-Area roots', (value: any) => {value.context.allAreasWithin = [Scope.NumericSpace];}],
        ['empty facets', (value: any) => {value.facets = {};}],
        ['invalid facet name', (value: any) => {value.facets[''] = {root: Scope.NumericRange};}],
        ['invalid facet object', (value: any) => {value.facets.range = null;}],
        ['unknown facet fields', (value: any) => {value.facets.range.value = 10;}],
        ['both selectors', (value: any) => {value.facets.range.labels = [Scope.NumbersSmaller10];}],
        ['missing selectors', (value: any) => {value.facets.range = {};}],
        ['invalid checks', (value: any) => {value.facets.range.check = 'strongest-bound';}],
        ['empty descriptor', (value: any) => {value.facets.range.root = '';}],
        ['unknown descriptor', (value: any) => {value.facets.range.root = 'unknown';}],
        ['empty labels', (value: any) => {value.facets.range = {labels: []};}],
        ['ineligible labels', (value: any) => {value.facets.range = {labels: [Scope.NumericAbstraction]};}],
        ['invalid rules', (value: any) => {value.rules = null;}],
        ['empty rule id', (value: any) => {value.rules[0].id = '';}],
        ['duplicate rule ids', (value: any) => {value.rules.push(value.rules[0]);}],
        ['unknown rule fields', (value: any) => {value.rules[0].predicate = true;}],
        ['empty assessments', (value: any) => {value.rules[0].assess = [];}],
        ['unknown assessment', (value: any) => {value.rules[0].assess = ['unknown'];}],
        ['null trigger', (value: any) => {value.rules[0].when = null;}],
        ['multiple selectors', (value: any) => {value.rules[0].when = {family: 'numeric', evidence: 'numericTask'};}],
        ['unknown family', (value: any) => {value.rules[0].when = {family: 'unknown'};}],
        ['unknown evidence', (value: any) => {value.rules[0].when = {evidence: 'unknown'};}],
        ['unknown selector', (value: any) => {value.rules[0].when = {all: []};}],
        ['empty any', (value: any) => {value.rules[0].when = {any: []};}],
        ['cyclic expression', (value: any) => {const loop: any = {any: []}; loop.any.push(loop); value.rules[0].when = loop;}],
        ['invalid conflicts', (value: any) => {value.conflicts = null;}],
        ['null conflict', (value: any) => {value.conflicts = [null];}],
        ['empty conflict id', (value: any) => {value.conflicts[0].id = '';}],
        ['duplicate conflict id', (value: any) => {value.conflicts[0].id = value.rules[0].id;}],
        ['unknown conflict fields', (value: any) => {value.conflicts[0].other = true;}],
        ['unknown conflict facet', (value: any) => {value.conflicts[0].facet = 'unknown';}],
        ['empty conflict facet', (value: any) => {value.conflicts[0].facet = '';}],
        ['invalid conflict choices', (value: any) => {value.conflicts[0].labels = null;}],
        ['single conflict choice', (value: any) => {value.conflicts[0].labels = [Scope.NumbersWithZero];}],
        ['duplicate conflict choices', (value: any) => {value.conflicts[0].labels = [Scope.NumbersWithZero, Scope.NumbersWithZero];}],
        ['unknown conflict descriptor', (value: any) => {value.conflicts[0].labels[0] = 'unknown';}],
        ['ineligible conflict descriptor', (value: any) => {value.conflicts[0].labels[0] = Scope.NumericAbstraction;}],
        ['conflict outside root family', (value: any) => {value.conflicts[0].labels[0] = Scope.Base10;}],
        ['conflict outside explicit family', (value: any) => {value.conflicts[0].facet = 'fractionMagnitude';}]
    ])('rejects %s', (_name, mutate) => {
        const value = graph();
        mutate(value);
        expect(() => createLabelDependencyEvaluator(value)).toThrow('Label dependency graph:');
    });
});

describe('ontology-bound evaluation identity', () => {
    const iri = (name: string) => `https://fixture.example/${name}`;
    const statement = (subject: string, predicate: string, object: string): OntologyStatement =>
        ({subject, predicate, object, source: 'fixture.ttl', sourceKind: 'descriptors'});
    const fixture = () => [
        ...bundledContext.statements.filter(item => item.sourceKind === 'schema'),
        ...['root', 'outside', 'allowed', 'mixed'].map(name => statement(iri(name),
            'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://edugraph.io/edu#Area')),
        statement(iri('allowed'), RELATION_IRIS.partOf, iri('root')),
        statement(iri('mixed'), RELATION_IRIS.partOf, iri('root')),
        statement(iri('mixed'), RELATION_IRIS.partOf, iri('outside'))
    ];
    const fixtureGraph: LabelDependencyGraph = {version: 1,
        context: {allAreasWithin: [iri('root')], requireArea: true},
        facets: {candidate: {labels: [iri('allowed'), iri('mixed')]}},
        rules: [{id: 'fixture', when: {family: 'candidate'}, assess: ['candidate']}]};

    it('accepts a permitted ancestry path alongside another path without creating an exclusion', () => {
        const custom = createLabelDependencyEvaluator(fixtureGraph, createOntologyContext(fixture()));
        expect(custom.evaluate([iri('mixed')]).context.status).toBe('eligible');
    });

    it('changes identity when absent candidate semantics or the context gate changes', () => {
        const base = fixture();
        const before = createLabelDependencyEvaluator(fixtureGraph, createOntologyContext(base));
        const after = createLabelDependencyEvaluator(fixtureGraph, createOntologyContext([...base,
            {...statement(iri('mixed'), 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy', 'A newly clarified candidate.'),
                objectKind: 'Literal'}
        ]));
        expect(after.policyHash).not.toBe(before.policyHash);
        const clarified = createLabelDependencyEvaluator(fixtureGraph, createOntologyContext([...base,
            {...statement(iri('mixed'), 'http://www.w3.org/2000/01/rdf-schema#comment', 'Supporting evidence boundary.'),
                objectKind: 'Literal'}
        ]));
        expect(clarified.policyHash).not.toBe(before.policyHash);
        const changed = createLabelDependencyEvaluator({...fixtureGraph,
            context: {allAreasWithin: [iri('outside')], requireArea: true}}, createOntologyContext(base));
        expect(changed.policyHash).not.toBe(before.policyHash);
        expect(changed.evaluate([iri('allowed')]).context.status).toBe('outside_policy_scope');
    });
});
