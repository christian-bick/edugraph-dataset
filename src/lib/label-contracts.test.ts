import {describe, expect, it} from 'vitest';
import {Area, Ability, Scope, bundledContext} from 'edugraph-ts/generated';
import {createOntologyContext, RELATION_IRIS, type OntologyStatement} from 'edugraph-ts/core';
import {createLabelContractIndex, validateModuleLabelContract,
    validateTargetLabelContract, assertResolvedTargetCoverage} from './label-contracts.ts';

const iri = (name: string) => `https://fixture.example/${name}`;
const fact = (subject: string, predicate: string, object: string): OntologyStatement =>
    ({subject, predicate, object, source: 'fixture.ttl', sourceKind: 'descriptors'});
const descriptors = (names: string[]) => [
    ...bundledContext.statements.filter(statement => statement.sourceKind === 'schema'),
    ...names.map(name => fact(iri(name), 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://edugraph.io/edu#Area'))
];

describe('label contracts', () => {
    it('rejects unknown and mixed/constituent parents, while allowing specialization families', () => {
        const index = createLabelContractIndex(createOntologyContext([
            ...descriptors(['parent', 'child', 'family', 'special', 'mixed']),
            fact(iri('child'), RELATION_IRIS.partOf, iri('parent')),
            fact(iri('special'), RELATION_IRIS.specializes, iri('family')),
            fact(iri('child'), RELATION_IRIS.partOf, iri('mixed')),
            fact(iri('special'), RELATION_IRIS.specializes, iri('mixed'))
        ]));
        expect(index.validate(['family', 'special', 'child'].map(iri), 'fixture')).toEqual([]);
        expect(index.validate(['parent', 'mixed', 'unknown'].map(iri), 'fixture')).toEqual([
            `SPEC-3 fixture: '${iri('parent')}' has constituent children and is ineligible.`,
            `SPEC-3 fixture: '${iri('mixed')}' has constituent children and is ineligible.`,
            `SPEC-3 fixture: unknown descriptor '${iri('unknown')}'.`
        ]);
    });

    it('checks every declaration field and explicit fallback even in an unmatched module', () => {
        const errors = validateModuleLabelContract({generalLabels: ['bad-general'],
            requiredLabels: ['bad-required'], rejectedLabels: ['bad-rejected'],
            schema: {plain: ['bad-plain'], tuple: [['bad-supported'], () => true, [['bad-fallback']]]}}, 'module');
        expect(errors).toHaveLength(6);
        expect(errors.every(error => error.includes('SPEC-3 module.'))).toBe(true);
        expect(validateModuleLabelContract({}, 'empty')).toEqual([]);
    });

    it('requires Area and Ability without requiring Scope or limiting conjunctions', () => {
        expect(validateTargetLabelContract([Area.Addition, Ability.ProcedureExecution], 'target')).toEqual([]);
        expect(validateTargetLabelContract([Area.Addition, Area.Subtraction, Ability.ProcedureExecution,
            Ability.ProcedureUnderstanding, Scope.NumbersSmaller20], 'target')).toEqual([]);
        expect(validateTargetLabelContract([], 'target')).toEqual([
            'TSPEC-14 target: missing Area.', 'TSPEC-14 target: missing Ability.'
        ]);
    });

    it('checks actual annotation coverage in the specialization direction and never copies claims', () => {
        expect(() => assertResolvedTargetCoverage([Area.Square], [Area.Rectangle], 'sample')).not.toThrow();
        const labels = [Area.Rectangle];
        expect(() => assertResolvedTargetCoverage(labels, [Area.Square], 'sample')).toThrow('SPEC-1 sample');
        expect(labels).toEqual([Area.Rectangle]);
        expect(() => assertResolvedTargetCoverage(['unknown'], [], 'sample')).toThrow('SPEC-3');
    });

    it('uses each supplied context for eligibility changes without contaminating the pinned release', () => {
        const base = descriptors(['parent', 'child']);
        const before = createLabelContractIndex(createOntologyContext(base));
        const after = createLabelContractIndex(createOntologyContext([
            ...base, fact(iri('child'), RELATION_IRIS.partOf, iri('parent'))
        ]));
        expect(before.validate([iri('parent')], 'before')).toEqual([]);
        expect(after.validate([iri('parent')], 'after')).toHaveLength(1);
        expect(before.validate([iri('parent')], 'before')).toEqual([]);
        expect(createLabelContractIndex().validate([Area.Rectangle], 'release')).toEqual([]);
        expect(createLabelContractIndex().validate([Area.CircularShapes], 'release')).toHaveLength(1);
    });
});
