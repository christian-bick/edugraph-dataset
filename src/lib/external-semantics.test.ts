import {describe, expect, it} from 'vitest';
import {
    buildOntologySemanticSnapshot,
    buildStandardsSemanticSnapshot,
    diffOntologySemantics,
    diffStandardsSemantics,
    OntologySemanticIndex,
    StandardsSemanticIndex,
    withOntologySemanticUsage
} from './external-semantics.ts';
import type {OntologyProvenance} from './coverage-identity.ts';
import type {StandardsProvenance} from './standards-source.ts';

const standardsProvenance = (revision: string): StandardsProvenance => ({
    provider: 'huggingface',
    repository: 'example/standards',
    revision,
    files: []
});

const ontologyProvenance = (version: string): OntologyProvenance => ({
    package: 'edugraph-ts',
    version,
    dependency: `https://example.test/${version}.tgz`,
    resolved: `https://example.test/${version}.tgz`,
    integrity: `sha512-${version}`
});

describe('external semantic deltas', () => {
    it('diffs standards by stable record id in linear comparison work', () => {
        const prior = buildStandardsSemanticSnapshot({
            standards: [
                {id: 'K.A.1', description: 'One', level: 'Standard', children: [], aspects: [], modeling: false},
                {id: 'K.A.2', description: 'Two', level: 'Standard', children: [], aspects: [], modeling: false}
            ],
            domainGroups: {A: {description: 'A'}},
            provenance: standardsProvenance('a'.repeat(40))
        });
        const current = buildStandardsSemanticSnapshot({
            standards: [
                {id: 'K.A.1', description: 'Changed', level: 'Standard', children: [], aspects: [], modeling: false},
                {id: 'K.A.3', description: 'Three', level: 'Standard', children: [], aspects: [], modeling: false}
            ],
            domainGroups: {A: {description: 'A'}},
            provenance: standardsProvenance('b'.repeat(40))
        });

        const delta = diffStandardsSemantics(prior, current);
        expect(delta.records).toEqual({
            added: ['standard:K.A.3'],
            changed: ['standard:K.A.1'],
            removed: ['standard:K.A.2']
        });
        expect(delta.work.records_compared).toBe(
            delta.work.previous_records + delta.work.current_records
        );
        expect(new StandardsSemanticIndex(current).standardForTarget('K.A.3-example')).toBe('K.A.3');
    });

    it('separates ontology definition and relation changes and resolves usage closure', () => {
        const a = 'http://edugraph.io/edu/A';
        const b = 'http://edugraph.io/edu/B';
        const c = 'http://edugraph.io/edu/C';
        const prior = buildOntologySemanticSnapshot({
            provenance: ontologyProvenance('v1'),
            entityRelations: {
                [a]: {definition: 'A', partOf: [b] as never[]},
                [b]: {definition: 'B'}
            }
        });
        const current = buildOntologySemanticSnapshot({
            provenance: ontologyProvenance('v2'),
            entityRelations: {
                [a]: {definition: 'A changed', partOf: [c] as never[]},
                [b]: {definition: 'B'},
                [c]: {definition: 'C'}
            }
        });

        const delta = diffOntologySemantics(prior, current);
        expect(delta.entities.added).toEqual([c]);
        expect(delta.entities.changed).toEqual([a]);
        expect(delta.relations.added).toEqual([`partOf|${a}|${c}`]);
        expect(delta.relations.removed).toEqual([`partOf|${a}|${b}`]);
        expect(delta.work.records_compared).toBe(
            delta.work.previous_entities + delta.work.current_entities
            + delta.work.previous_relations + delta.work.current_relations
        );
        const closure = new OntologySemanticIndex(current).closure([a]);
        expect(closure.entities).toEqual([a, c]);
        expect(closure.relations).toEqual([`partOf|${a}|${c}`]);
        expect(closure.work.entities_visited).toBe(2);

        const used = withOntologySemanticUsage(current, 'ccss', [a]);
        expect(used.usages.ccss.roots).toEqual([a]);
        expect(used.usages.ccss.entities).toEqual([a, c]);
        expect(used.usages.ccss.relations).toEqual([`partOf|${a}|${c}`]);
        expect(used.usages.ccss.input_sha256).toMatch(/^[a-f\d]{64}$/);
        expect(diffOntologySemantics(current, used).usages.added).toEqual(['ccss']);
    });
});
