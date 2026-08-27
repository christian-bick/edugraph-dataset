import {describe, expect, it} from 'vitest';
import {
    buildOntologySemanticSnapshot,
    OntologySemanticIndex,
    withOntologySemanticUsage
} from './external-semantics.ts';
import type {OntologyProvenance} from './coverage-identity.ts';

const ontologyProvenance = (version: string): OntologyProvenance => ({
    package: 'edugraph-ts',
    version,
    dependency: `https://example.test/${version}.tgz`,
    resolved: `https://example.test/${version}.tgz`,
    integrity: `sha512-${version}`
});

describe('external semantic deltas', () => {
    it('separates ontology definition and relation changes and resolves usage closure', () => {
        const a = 'http://edugraph.io/edu/A';
        const b = 'http://edugraph.io/edu/B';
        const c = 'http://edugraph.io/edu/C';
        const d = 'http://edugraph.io/edu/D';
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
                [c]: {definition: 'C', specializes: [d] as never[]},
                [d]: {definition: 'D'}
            }
        });

        expect(prior.entities[a].definition_hash).not.toBe(current.entities[a].definition_hash);
        expect(prior.relations[`partOf|${a}|${b}`]).toBeDefined();
        expect(current.relations[`partOf|${a}|${c}`]).toBeDefined();
        const closure = new OntologySemanticIndex(current).closure([a]);
        expect(closure.entities).toEqual([a, c, d]);
        expect(closure.relations).toEqual([
            `partOf|${a}|${c}`,
            `specializes|${c}|${d}`
        ]);
        expect(closure.work.entities_visited).toBe(3);

        const used = withOntologySemanticUsage(current, 'ccss', [a]);
        expect(used.usages.ccss.roots).toEqual([a]);
        expect(used.usages.ccss.entities).toEqual([a, c, d]);
        expect(used.usages.ccss.relations).toEqual([
            `partOf|${a}|${c}`,
            `specializes|${c}|${d}`
        ]);
        expect(used.usages.ccss.input_sha256).toMatch(/^[a-f\d]{64}$/);
        expect(current.usages.ccss).toBeUndefined();
    });
});
