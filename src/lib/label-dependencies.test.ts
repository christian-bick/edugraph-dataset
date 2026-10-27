import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope, bundledContext} from 'edugraph-ts/generated';
import {createOntologyContext, RELATION_IRIS, type OntologyStatement} from 'edugraph-ts/core';
import {labelDependencies} from '../validation/label-dependencies.ts';
import type {LabelDependencyGraph} from '../types/label-dependencies.ts';
import {createLabelDependencyEvaluator, validateLabelDependencyGraph} from './label-dependencies.ts';

const evaluator = createLabelDependencyEvaluator();
const graph = (): LabelDependencyGraph => structuredClone(labelDependencies);
const core = (labels: readonly string[]) => evaluator.evaluate([Area.Addition, ...labels]);
const assessment = (labels: readonly string[], facet: string) => core(labels).assessments.find(item => item.facet === facet)!;

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
            expect(result.conflicts).toEqual([]);
        }
    });

    it('rejects empty, unknown, and ineligible label sets even when an outside Area is present', () => {
        expect(evaluator.evaluate([]).context.status).toBe('invalid_context');
        expect(evaluator.evaluate([Scope.IntegerNumbers]).errors).toContain('At least one resolved Area is required.');
        const result = evaluator.evaluate([Area.EquationSolving, 'unknown', Area.Arithmetic]);
        expect(result.context.status).toBe('invalid_context');
        expect(result.errors).toEqual([`Ineligible descriptor '${Area.Arithmetic}'.`, "Unknown descriptor 'unknown'."]);
    });

    it('uses authoritative resolved Areas without adding them as annotation claims', () => {
        const labels = [Area.Addition, Scope.IntegerNumbers];
        expect(evaluator.evaluate(labels, [Area.EquationSolving]).context.status).toBe('outside_policy_scope');
        const allowed = evaluator.evaluate(labels, [Area.Equation]);
        expect(allowed.context.areas).toEqual([Area.Addition, Area.Equation]);
        expect(allowed.assessments.flatMap(item => item.labels)).not.toContain(Area.Equation);
        expect(evaluator.evaluate(labels, [Scope.Base10]).errors)
            .toContain(`Resolved context label '${Scope.Base10}' is not an Area.`);
        expect(labels).toEqual([Area.Addition, Scope.IntegerNumbers]);
    });

    it('does not infer numeric, operand, frame or explanation obligations merely from allowed Areas', () => {
        const result = evaluator.evaluate([Area.Equation, Ability.TextualArticulation]);
        expect(result.context.status).toBe('eligible');
        expect(result.assessments).toEqual([]);
        expect(result.triggers.every(trigger => trigger.status === 'absent')).toBe(true);
    });
});

describe('annotation dependency assessment', () => {
    it('reports required families without inventing a label value or mutating annotations', () => {
        const labels = [Scope.IntegerNumbers];
        const before = [...labels];
        const result = core(labels);
        expect(result.triggers.find(trigger => trigger.ruleId === 'LD-NUM-01')).toEqual({
            ruleId: 'LD-NUM-01', status: 'present', labels: [Scope.IntegerNumbers]
        });
        expect(result.assessments).toHaveLength(6);
        expect(assessment(labels, 'base')).toEqual({ruleId: 'LD-NUM-01', facet: 'base', status: 'missing', labels: [],
            reason: 'No label from the required annotation family is present.'});
        expect(assessment(labels, 'numberKind').status).toBe('satisfied');
        expect(result.assessments.every(item => ['missing', 'satisfied'].includes(item.status))).toBe(true);
        expect(labels).toEqual(before);
    });

    it.each([Scope.ArabicNumerals, Scope.TwoOperands, Scope.SingleDigitLargestOperand])(
        'recognizes numeric annotations outside the NumericAbstraction subtree: %s', label => {
            const result = core([label]);
            expect(result.triggers.find(item => item.ruleId === 'LD-NUM-01')!.status).toBe('present');
            expect(result.assessments.find(item => item.facet === 'numberKind')!.status).toBe('missing');
        });

    it.each([[Scope.TwoOperands, 'operandDigits'], [Scope.SingleDigitLargestOperand, 'operandCount']])(
        'requires the complementary operand annotation family for %s', (label, missing) => {
            expect(assessment([label], missing).status).toBe('missing');
        });

    it('limits range checks to existing annotation presence without calculating replacement bounds', () => {
        const labels = [Scope.NumbersLarger10, Scope.NumbersSmaller1000];
        expect(assessment(labels, 'range')).toMatchObject({status: 'satisfied',
            labels: [Scope.NumbersLarger10, Scope.NumbersSmaller1000].sort(),
            reason: 'Range facet is present under existing semantics; no bounds were calculated.'});
        expect(assessment([Scope.IntegerNumbers], 'range')).toMatchObject({status: 'missing',
            reason: 'Missing range facet under existing semantics; no replacement bounds were calculated.'});
        expect(labels).toEqual([Scope.NumbersLarger10, Scope.NumbersSmaller1000]);
    });

    it.each([
        ['0/5', Scope.ProperFractions, Scope.NumbersWithZero, Scope.NumbersWithoutNegatives],
        ['-1/2', Scope.ProperFractions, Scope.NumbersWithoutZero, Scope.NumbersWithNegatives],
        ['3/2', Scope.ImproperFractions, Scope.NumbersWithoutZero, Scope.NumbersWithoutNegatives]
    ])('requires magnitude but no nonexhaustive unit classification for %s', (_example, magnitude, zero, sign) => {
        const result = core([magnitude, zero, sign]);
        expect(result.assessments.some(item => item.facet === 'fractionUnit')).toBe(false);
        expect(assessment([magnitude], 'fractionMagnitude').status).toBe('satisfied');
    });

    it('requires magnitude for a generic fraction and base for arbitrarily precise decimals', () => {
        expect(assessment([Scope.FractionNumbers], 'fractionMagnitude').status).toBe('missing');
        const result = core([Scope.DecimalNumbers]);
        expect(result.assessments.some(item => item.facet === 'decimalPrecision')).toBe(false);
        expect(assessment([Scope.DecimalNumbers], 'base').status).toBe('missing');
        expect(core([Scope.DecimalNumbers, Scope.Base10]).assessments.filter(item => item.facet === 'base')
            .every(item => item.status === 'satisfied')).toBe(true);
    });

    it.each([
        ['zero', Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        ['sign', Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
        ['referenceFrames', Scope.SingleFrameOfReference, Scope.MultipleFramesOfReference]
    ])('detects contradictory %s annotations', (facet, left, right) => {
        expect(core([left, right, left]).conflicts).toEqual([expect.objectContaining({facet, labels: [left, right].sort()})]);
        expect(core([left]).conflicts).toEqual([]);
        expect(evaluator.evaluate([Area.EquationSolving, left, right]).conflicts).toEqual([]);
    });

    it('permits legitimate mixed labels outside explicitly exclusive groups', () => {
        expect(core([Scope.IntegerNumbers, Scope.DecimalNumbers, Scope.ArabicNumerals, Scope.RomanNumerals,
            Scope.TwoOperands, Scope.FourOperands, Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand,
            Scope.ProperFractions, Scope.ImproperFractions, Scope.UnitFractions, Scope.NonUnitFractions]).conflicts).toEqual([]);
    });

    it('normalizes labels and authored order for deterministic diagnostics and identity', () => {
        const value = graph();
        (value as any).rules = [...value.rules].reverse();
        (value as any).facets = Object.fromEntries(Object.entries(value.facets).reverse());
        (value as any).conflicts = [...value.conflicts!].reverse().map(rule => ({...rule, labels: [...rule.labels].reverse()}));
        const custom = createLabelDependencyEvaluator(value);
        const labels = [Area.Addition, Scope.IntegerNumbers, Scope.ArabicNumerals, Scope.NumbersWithZero, Scope.NumbersWithoutZero];
        expect(custom.policyHash).toBe(evaluator.policyHash);
        expect(custom.evaluate(labels)).toEqual(evaluator.evaluate([...labels].reverse().concat(labels[0])));
        (value as any).conflicts = [];
        expect(createLabelDependencyEvaluator(value).policyHash).not.toBe(evaluator.policyHash);
    });

    it('binds immutable policy semantics even if the authored object changes later', () => {
        const value = graph();
        const custom = createLabelDependencyEvaluator(value);
        (value as any).context.allAreasWithin = [Area.Algebra];
        expect(custom.evaluate([Area.Addition]).context.status).toBe('eligible');
    });

    it('accepts repeated trigger alternatives without duplicating rule assessments', () => {
        const value = graph();
        (value as any).rules[0].when.any.push({family: 'numeric'});
        expect(createLabelDependencyEvaluator(value).evaluate([Area.Addition, Scope.IntegerNumbers]).assessments)
            .toEqual(evaluator.evaluate([Area.Addition, Scope.IntegerNumbers]).assessments);
    });

    it('normalizes duplicate conflict candidates without creating false conflicts', () => {
        const value = graph();
        (value as any).conflicts[0].labels.push(value.conflicts![0].labels[0]);
        expect(createLabelDependencyEvaluator(value).evaluate([Area.Addition, Scope.NumbersWithZero]).conflicts).toEqual([]);
    });

    it('supports explicit candidate families without making every family mutually exclusive', () => {
        const value = graph();
        (value as any).facets.zero = {labels: [Scope.NumbersWithZero, Scope.NumbersWithoutZero]};
        expect(createLabelDependencyEvaluator(value).evaluate([Area.Addition, Scope.NumbersWithZero, Scope.NumbersWithoutZero]).conflicts)
            .toHaveLength(1);
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
        ['removed evidence selector', (value: any) => {value.rules[0].when = {evidence: 'unknown'};}],
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
