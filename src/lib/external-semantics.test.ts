import {describe, expect, it} from 'vitest';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, resolve} from 'node:path';
import {
    buildOntologySemanticSnapshot,
    OntologySemanticIndex,
    resolveOntologySemanticUsage,
    withOntologySemanticUsage
} from './external-semantics.ts';
import type {OntologyProvenance} from './coverage-identity.ts';
import {createDependencyGraphSnapshot, planDependencyDelta} from './dependency-planner.ts';
import {createOntologyContext, RELATION_IRIS, type OntologyStatement} from 'edugraph-ts/core';
import {Area, Scope, Ability, bundledContext} from 'edugraph-ts/generated';
import {computeLabelContextHash, resolveVqaLabelDefinitions} from './vqa-cache.ts';

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
    it.each(['label', 'comment'])('invalidates VQA alone when an ontology %s changes', annotation => {
        const iri = 'http://edugraph.io/edu/Example';
        const context = (text: string) => createOntologyContext([
            ...schema, descriptor(iri), definition(iri, 'A reusable concept.'),
            {...fact(iri, `http://www.w3.org/2000/01/rdf-schema#${annotation}`, text), objectKind: 'Literal'}
        ]);
        const before = context('Original text');
        const after = context('Revised text');
        const snapshot = (source: typeof before) => buildOntologySemanticSnapshot({
            provenance: ontologyProvenance('v0.29.0'), context: source
        });
        const prior = snapshot(before);
        const current = snapshot(after);
        expect(current.entities[iri].identity_hash).toBe(prior.entities[iri].identity_hash);
        expect(current.relations).toEqual(prior.relations);
        expect(current.entities[iri].definition_hash).not.toBe(prior.entities[iri].definition_hash);
        expect(computeLabelContextHash(resolveVqaLabelDefinitions([iri], after)))
            .not.toBe(computeLabelContextHash(resolveVqaLabelDefinitions([iri], before)));
        expect(resolveVqaLabelDefinitions([iri], after)[0].definition).toContain('Revised text');
        const graph = (state: typeof prior) => createDependencyGraphSnapshot([
            {id: 'entity', kind: 'ontology-entity', input_hash: state.entities[iri].identity_hash, dependencies: []},
            {id: 'text', kind: 'ontology-entity', input_hash: state.entities[iri].definition_hash, dependencies: []},
            {id: 'image', kind: 'image', input_hash: 'pixels', dependencies: ['entity']},
            {id: 'vqa', kind: 'vqa-record', input_hash: 'verdict', dependencies: ['image', 'text']}
        ]);
        expect(planDependencyDelta(graph(prior), graph(current)).affected_nodes).toEqual(['text', 'vqa']);
    });

    it('rejects missing VQA definitions while allowing incomplete inventory snapshots', () => {
        const iri = 'http://edugraph.io/edu/Incomplete';
        const context = createOntologyContext([...schema, descriptor(iri)]);
        expect(() => buildOntologySemanticSnapshot({provenance: ontologyProvenance('v0.29.0'), context})).not.toThrow();
        expect(() => resolveVqaLabelDefinitions([iri], context)).toThrow('Missing definition');
    });

    it('tracks rule queries, choice defaults, and resolver context that are not positive capabilities', async () => {
        const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-semantic-choice-'));
        const dependency = 'https://example.test/ontology-v1.tgz';
        const files = {
            'package.json': JSON.stringify({dependencies: {'edugraph-ts': dependency}}),
            'package-lock.json': JSON.stringify({packages: {'node_modules/edugraph-ts': {
                version: '1.0.0', resolved: dependency, integrity: 'sha512-v1'}}}),
            'src/generators/demo/spec.ts': `
                const resolver = Object.assign(() => 'integer', {labelResolution: 'exact', labelChoices: {
                    kind: 'alternatives', contextLabels: [${JSON.stringify(Scope.InchScale)}],
                    defaults: [{whenAll: [${JSON.stringify(Scope.SingleFrameOfReference)}], labels: [${JSON.stringify(Scope.FractionNumbers)}]}]
                }});
                export const DemoGeneratorSchema = {kind: [[${JSON.stringify(Scope.IntegerNumbers)}, ${JSON.stringify(Scope.FractionNumbers)}], resolver]};
                export const spec = {generalLabels: [${JSON.stringify(Area.Addition)}], compatibility: [{
                    id: 'shape-query', dependencies: [{scope: 'generator', label: ${JSON.stringify(Area.Rectangle)}}], predicate: () => true
                }]};
            `,
            'src/generators/demo/generator.ts': 'export class DemoGenerator implements ProblemGenerator<ArithmeticPairProblem> {}',
            'src/visuals/views/demo-view/spec.ts': `
                export const DemoViewViewSchema = {};
                export const spec = {viewId: 'demo-view', generalLabels: [${JSON.stringify(Ability.ProcedureExecution)}], compatibility: [{
                    id: 'target-query', dependencies: [{scope: 'target', label: ${JSON.stringify(Area.Square)}}], predicate: () => true
                }]};
            `,
            'src/visuals/views/demo-view/view.tsx': 'throw new Error("renderer must not be loaded");',
            'src/spec/demo.ts': `export const spec = [{id: 'target', labels: [${JSON.stringify(Scope.StepsOf1)}]}];`
        };
        try {
            for (const [path, content] of Object.entries(files)) {
                mkdirSync(dirname(resolve(projectRoot, path)), {recursive: true});
                writeFileSync(resolve(projectRoot, path), content);
            }
            const {usage} = await resolveOntologySemanticUsage(projectRoot, 'demo');
            expect(usage.roots).toEqual(expect.arrayContaining([
                Scope.InchScale, Scope.SingleFrameOfReference, Area.Rectangle, Area.Square,
                Scope.IntegerNumbers, Scope.FractionNumbers, Scope.StepsOf1
            ]));
            expect(usage.relations).toContain(`specializes|${Area.Square}|${Area.Rectangle}`);
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });

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
