import {requireTargetLabels, rejectTargetLabels} from './compatibility.ts';
import {describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope, bundledContext} from 'edugraph-ts/generated';
import {createOntologyContext, RELATION_IRIS, type OntologyStatement} from 'edugraph-ts/core';
import {ontologyNeutral} from './resolvers.ts';
import {collectPositiveCapabilities, inspectPositiveOwnership,
    type OwnershipModule, type CapabilityDeclaration} from './spec-ownership.ts';
import {createWorkCounters} from './work-counters.ts';

const pair = {generatorId: 'g', viewId: 'v'};
const module = (role: 'generator' | 'view', declaration: CapabilityDeclaration, labels: string[]): OwnershipModule => ({
    role, module_id: role === 'generator' ? 'g' : 'v',
    generalLabels: declaration === 'generalLabels' ? labels : [],
    schema: declaration === 'schema' ? {choice: labels} : {}
});
const inspectPair = (left: OwnershipModule, right: OwnershipModule) =>
    inspectPositiveOwnership({modules: [left, right], pairs: [pair]});

describe('positive ownership contracts', () => {
    for (const generatorDeclaration of ['generalLabels', 'schema'] as const) {
        for (const viewDeclaration of ['generalLabels', 'schema'] as const) {
            it.each([Area.Rectangle, Scope.ArabicNumerals, Ability.Formalization])(
                `checks ${generatorDeclaration}/${viewDeclaration} overlap for %s`, label => {
                    const issues = inspectPair(module('generator', generatorDeclaration, [label]),
                        module('view', viewDeclaration, [label]));
                    const overlap = issues.filter(issue => issue.code === 'cross-role-positive-overlap');
                    expect(overlap).toHaveLength(1);
                    expect(overlap[0].rule_ids).toEqual(['SPEC-8', 'SPEC-11']);
                    expect(overlap[0].declarations.map(entry => [entry.declaration, entry.capability]))
                        .toEqual([[generatorDeclaration, label], [viewDeclaration, label]]);
                    expect(overlap[0].message).toContain(label);
                    if (viewDeclaration === 'schema') expect(overlap[0].message).toContain('schema.choice');
                });
        }
    }

    it.each([[Area.Rectangle, Area.Square], [Area.Square, Area.Rectangle]])(
        'detects specialization overlap in either direction: %s / %s', (left, right) => {
            expect(inspectPair(module('generator', 'generalLabels', [left]), module('view', 'schema', [right]))
                .map(issue => issue.code)).toEqual(['cross-role-positive-overlap']);
        });

    it('allows structural relations and independent capabilities', () => {
        expect(inspectPair(module('generator', 'generalLabels', [Area.Measurement, Area.ShapeIdentity, Area.Addition]),
            module('view', 'schema', [Area.MeasuringObjects, Area.ShapeNaming, Area.Equation]))).toEqual([]);
    });

    it('checks every module even without any compatible pair or active target', () => {
        const declarations: OwnershipModule = {
            role: 'generator', module_id: 'unmatched',
            generalLabels: [Area.Rectangle, Area.Square, Ability.Formalization],
            schema: {shape: [Area.Rectangle], ability: [Ability.ProcedureExecution]}
        };
        const issues = inspectPositiveOwnership({modules: [declarations], pairs: []});
        expect(issues.filter(issue => issue.code === 'generator-ability')).toHaveLength(2);
        expect(issues.filter(issue => issue.code === 'redundant-general-labels')).toHaveLength(1);
        expect(issues.filter(issue => issue.code === 'schema-general-overlap')).toHaveLength(2);
        expect(issues.find(issue => issue.code === 'redundant-general-labels')?.rule_ids).toEqual(['SPEC-2']);
        expect(issues.find(issue => issue.code === 'schema-general-overlap')?.rule_ids).toEqual(['SPEC-7']);
        expect(issues.find(issue => issue.code === 'generator-ability')?.rule_ids).toEqual(['SPEC-G3', 'SPEC-V5']);
    });

    it('also rejects invariant/schema overlap in views', () => {
        expect(inspectPositiveOwnership({modules: [{role: 'view', module_id: 'v',
            generalLabels: [Area.Square], schema: {shape: [Area.Rectangle]}}], pairs: []})
            .map(issue => issue.code)).toEqual(['schema-general-overlap']);
    });

    it('does not turn related schema alternatives into invariant conjunctions', () => {
        expect(inspectPositiveOwnership({modules: [module('generator', 'schema', [Area.Rectangle, Area.Square])],
            pairs: []})).toEqual([]);
        expect(collectPositiveCapabilities({role: 'view', module_id: 'v', generalLabels: [],
            schema: {style: ontologyNeutral(() => 'plain')}})).toEqual([]);
    });

    it('does not compare incompatible roles, or use requirements as positive declarations', () => {
        const modules = [module('generator', 'generalLabels', [Area.Square]),
            {...module('view', 'schema', [Area.Square]), compatibility: [requireTargetLabels('required', [Area.Square]), rejectTargetLabels('rejected', [Area.Rectangle])]}];
        expect(inspectPositiveOwnership({modules, pairs: []})).toEqual([]);
        expect(inspectPair(modules[0], {...modules[1], schema: {}})).toEqual([]);
    });

    it('keeps witnesses stable under reordering and duplicate declarations/pairs', () => {
        const left = {...module('generator', 'generalLabels', [Area.Rectangle, Area.Square]),
            schema: {b: [Area.Equation], a: [Area.Addition]}};
        const right = module('view', 'schema', [Area.Square, Area.Addition]);
        const expected = inspectPair(left, right);
        const actual = inspectPositiveOwnership({modules: [
            {...right, schema: {choice: [Area.Addition, Area.Square, Area.Square]}},
            {...left, generalLabels: [Area.Square, Area.Rectangle, Area.Rectangle],
                schema: {a: [Area.Addition], b: [Area.Equation]}}
        ], pairs: [pair, pair]});
        expect(actual).toEqual(expected);
        expect(new Set(actual.map(issue => issue.id)).size).toBe(actual.length);
    });

    it('fails rather than assessing an incomplete supplied pair', () => {
        expect(() => inspectPositiveOwnership({modules: [], pairs: [pair]})).toThrow('g#v');
        expect(inspectPositiveOwnership({modules: [], pairs: []})).toEqual([]);
    });
});

const iri = (id: string | number) => `https://fixture.example/${id}`;
const fact = (subject: string, object: string): OntologyStatement => ({subject, predicate: RELATION_IRIS.specializes,
    object, source: 'fixture.ttl', sourceKind: 'descriptors'});
const ancestorsIn = (statements: OntologyStatement[]) => {
    const context = createOntologyContext([
        ...bundledContext.statements.filter(statement => statement.sourceKind === 'schema'), ...statements
    ]);
    return vi.fn((label: string) => new Set([label, ...context.traverse(label, RELATION_IRIS.specializes)]));
};

describe('ownership indexes', () => {
    it('finds either parent in a multi-parent graph without confusing siblings', () => {
        const ancestorsOf = ancestorsIn([fact(iri('child'), iri('a')), fact(iri('child'), iri('b')),
            fact(iri('sibling'), iri('b'))]);
        const check = (right: string) => inspectPositiveOwnership({
            modules: [module('generator', 'generalLabels', [iri('child')]), module('view', 'schema', [right])],
            pairs: [pair], ancestorsOf
        });
        expect(check(iri('a'))).toHaveLength(1);
        expect(check(iri('b'))).toHaveLength(1);
        expect(check(iri('sibling'))).toEqual([]);
    });

    it('resolves shared ancestry once and scales with declarations and compatible pair edges', () => {
        const ancestorsOf = ancestorsIn([fact(iri('leaf'), iri('parent'))]);
        const run = (size: number) => {
            ancestorsOf.mockClear();
            const counters = createWorkCounters();
            const modules: OwnershipModule[] = [];
            const pairs = [];
            for (let i = 0; i < size; i++) {
                modules.push({...module('generator', 'generalLabels', [iri('leaf')]), module_id: `g${i}`},
                    {...module('view', 'schema', [iri('parent')]), module_id: `v${i}`});
                pairs.push({generatorId: `g${i}`, viewId: `v${i}`});
            }
            expect(inspectPositiveOwnership({modules, pairs, counters, ancestorsOf})).toHaveLength(size);
            expect(ancestorsOf).toHaveBeenCalledTimes(2);
            return counters;
        };
        const small = run(40);
        const large = run(80);
        for (const metric of ['modules', 'declarations', 'index_entries', 'pairs', 'label_lookups', 'issues']) {
            expect(large.get(`ownership.${metric}`)).toBe(small.get(`ownership.${metric}`) * 2);
        }
    });

    it('handles deep specialization with work proportional to the referenced ancestry', () => {
        const run = (depth: number) => {
            const ancestorsOf = ancestorsIn(Array.from({length: depth}, (_, i) => fact(iri(i + 1), iri(i))));
            const counters = createWorkCounters();
            expect(inspectPositiveOwnership({modules: [module('generator', 'schema', [iri(depth)]),
                module('view', 'generalLabels', [iri(0)])], pairs: [pair], counters, ancestorsOf})).toHaveLength(1);
            expect(ancestorsOf).toHaveBeenCalledTimes(2);
            return counters.get('ownership.ancestor_entries');
        };
        expect(run(80)).toBeLessThanOrEqual(run(40) * 2);
    });
});
