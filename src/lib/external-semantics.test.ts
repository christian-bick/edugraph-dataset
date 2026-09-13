import {describe, expect, it} from 'vitest';
import {
    buildOntologySemanticSnapshot,
    OntologySemanticIndex,
    withOntologySemanticUsage
} from './external-semantics.ts';
import type {OntologyProvenance} from './coverage-identity.ts';
import {createDependencyGraphSnapshot, planDependencyDelta} from './dependency-planner.ts';
import {createOntologyContext, RELATION_IRIS, type OntologyStatement} from 'edugraph-ts/core';
import {Area, bundledContext} from 'edugraph-ts/generated';

const schema = bundledContext.statements.filter(statement => statement.sourceKind === 'schema');
const fact = (subject: string, predicate: string, object: string): OntologyStatement =>
    ({subject, predicate, object, source: 'fixture.ttl', sourceKind: 'descriptors'});
const descriptor = (iri: string) => fact(iri, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://edugraph.io/edu#Area');
const definition = (iri: string, text: string): OntologyStatement =>
    ({...fact(iri, 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy', text), objectKind: 'Literal'});

const ontologyProvenance = (version: string): OntologyProvenance => ({
    package: 'edugraph-ts',
    version,
    dependency: `https://example.test/${version}.tgz`,
    resolved: `https://example.test/${version}.tgz`,
    integrity: `sha512-${version}`
});

describe('external semantic deltas', () => {
    it('invalidates parent users on child addition, removal and reparenting without touching unrelated users', () => {
        const [a, b, unrelated, child] = ['a', 'b', 'unrelated', 'child'].map(name => `https://fixture.example/${name}`);
        const snapshot = (parent?: string) => buildOntologySemanticSnapshot({
            provenance: ontologyProvenance('v1'), context: createOntologyContext([
                ...schema, ...[a, b, unrelated].map(descriptor),
                ...(parent ? [descriptor(child), fact(child, RELATION_IRIS.partOf, parent)] : [])
            ])
        });
        const graph = (state: ReturnType<typeof snapshot>) => createDependencyGraphSnapshot(
            [a, b, unrelated].flatMap(label => [
                {id: label, kind: 'ontology-entity' as const, input_hash: state.entities[label].identity_hash, dependencies: []},
                {id: `user:${label}`, kind: 'competency-target' as const, input_hash: label, dependencies: [label]}
            ]));
        expect(planDependencyDelta(graph(snapshot()), graph(snapshot(a))).affected_nodes).toEqual([a, `user:${a}`]);
        expect(planDependencyDelta(graph(snapshot(a)), graph(snapshot())).affected_nodes).toEqual([a, `user:${a}`]);
        expect(planDependencyDelta(graph(snapshot(a)), graph(snapshot(b))).affected_nodes)
            .toEqual([a, b, `user:${a}`, `user:${b}`]);
    });
    it('separates ontology definition and relation changes and resolves usage closure', () => {
        const a = 'http://edugraph.io/edu/A';
        const b = 'http://edugraph.io/edu/B';
        const c = 'http://edugraph.io/edu/C';
        const d = 'http://edugraph.io/edu/D';
        const prior = buildOntologySemanticSnapshot({
            provenance: ontologyProvenance('v1'),
            context: createOntologyContext([...schema, ...[a, b].map(descriptor),
                definition(a, 'A'), definition(b, 'B'), fact(a, RELATION_IRIS.partOf, b)])
        });
        const current = buildOntologySemanticSnapshot({
            provenance: ontologyProvenance('v2'),
            context: createOntologyContext([...schema, ...[a, b, c, d].map(descriptor),
                definition(a, 'A changed'), definition(b, 'B'), definition(c, 'C'), definition(d, 'D'),
                fact(a, RELATION_IRIS.partOf, c), fact(c, RELATION_IRIS.specializes, d)])
        });

        expect(prior.entities[a].definition_hash).not.toBe(current.entities[a].definition_hash);
        expect(current.entities[a].dimension).toBe('Area');
        expect(current.relations[`hasPart|${c}|${a}`]).toBeDefined();
        expect(current.relations[`structures|${a}|${c}`]).toBeDefined();
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

    it('uses the same pinned facts for validation and dependency tracking', () => {
        const options = {provenance: ontologyProvenance('v0.26.0')};
        const snapshot = buildOntologySemanticSnapshot(options);
        expect(snapshot).toEqual(buildOntologySemanticSnapshot({...options, context: bundledContext}));
        expect(snapshot.entities[Area.Rectangle].dimension).toBe('Area');
        expect(snapshot.relations[`specializes|${Area.Square}|${Area.Rectangle}`]).toBeDefined();
    });
});
