import {describe, expect, it, vi} from 'vitest';
import {Area, Scope} from 'edugraph-ts/generated';
import type {ConfigSchema} from '../types/schema.ts';
import type {ModuleSpec} from '../types/module-spec.ts';
import {planCompatibility} from './compatibility.ts';
import {enumerateDependencyAuditSelections, buildLabelDependencyAudit} from './label-dependency-audit.ts';
import {resolveDependencyAuditAnnotation} from './label-dependency-annotation-resolution.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import {summarizeLabelDependencyCoverage} from './label-dependency-coverage.ts';
import {ontologyNeutral, selectExactMatch} from './resolvers.ts';
import {normalizeSchemaChoices} from './schema-choices.ts';
import {getRandomState, setSeed} from './random.ts';

const labels = [Area.Addition, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives];
function fixture(schema: ConfigSchema) {
    const result = planCompatibility({identity: {targetId: 'target', generatorId: 'g', viewId: 'v'},
        targetLabels: [Area.Addition], generatorLabels: labels, viewLabels: [],
        fields: normalizeSchemaChoices(schema, [Area.Addition], 'generator')});
    if (!result.supported) throw new Error('Fixture must match.');
    return {plan: result.plan, selection: enumerateDependencyAuditSelections(result.plan).selections[0]};
}

describe('configuration inference in the source dependency audit', () => {
    it('uses actual singleton output, retains lineage, and never unions advertised alternatives', () => {
        const schema = {cardinality: [[Scope.TwoOperands], selectExactMatch]} as const;
        const spec: ModuleSpec<typeof schema> = {generalLabels: labels, inferredLabels: [{
            produces: [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
            infer: config => config.cardinality === Scope.TwoOperands ? [Scope.NumbersWithoutZero] : [Scope.NumbersWithZero]
        }]};
        setSeed(81);
        const state = getRandomState();
        const resolved = resolveDependencyAuditAnnotation({id: 'stable-selection', ...fixture(schema), generator: {spec, schema}});
        expect(resolved.annotationResolution).toMatchObject({status: 'exhaustive', outcome: {
            parentSelectionId: 'stable-selection', configurations: {generator: {cardinality: Scope.TwoOperands}},
            inferredLabels: [Scope.NumbersWithoutZero]
        }});
        expect(resolved.labels).toContain(Scope.NumbersWithoutZero);
        expect(resolved.labels).not.toContain(Scope.NumbersWithZero);
        expect(resolved.declaredLabels).not.toContain(Scope.NumbersWithoutZero);
        expect(getRandomState()).toBe(state);
    });

    it('keeps unknown configuration inference pending without calling resolver or inference', () => {
        const resolver = vi.fn(() => 7);
        const infer = vi.fn(() => [Scope.NumbersWithZero]);
        const schema = {unknown: ontologyNeutral(resolver)};
        const resolved = resolveDependencyAuditAnnotation({id: 'pending-selection', ...fixture(schema), generator: {
            schema, spec: {generalLabels: labels, inferredLabels: [{produces: [Scope.NumbersWithZero], infer}]}
        }});
        expect(resolved.annotationResolution).toMatchObject({status: 'pending', owners: [{owner: 'generator', fields: ['unknown']}]});
        expect(resolved.labels).not.toContain(Scope.NumbersWithZero);
        expect(resolver).not.toHaveBeenCalled();
        expect(infer).not.toHaveBeenCalled();
        const evaluator = createLabelDependencyEvaluator();
        expect(evaluator.evaluate(resolved.labels).assessments).toContainEqual(expect.objectContaining({facet: 'zero', status: 'missing'}));
        const report = buildLabelDependencyAudit({spec: 'fixture', policyHash: evaluator.policyHash, ontology: {},
            dataset: {status: 'available', generationId: 'fixture'}, evaluate: evaluator.evaluate,
            selectionCoverage: [{targetId: 'target', generatorId: 'g', viewId: 'v', status: 'complete', total: '1', checked: 1,
                annotationResolution: {status: 'pending', exhaustive: 0, pending: 1, invalid: 0}}],
            subjects: [{id: 'pending-selection', kind: 'selection', targetId: 'target', generatorId: 'g', viewId: 'v', ...resolved}]});
        expect(report.summary.pending_inference_selections).toBe(1);
        expect(summarizeLabelDependencyCoverage(report).failures).toContainEqual(expect.objectContaining({code: 'enumeration'}));
    });

    it('does not resolve an unrelated owner with no inference rules', () => {
        const unknown = vi.fn(() => 1);
        const resolved = resolveDependencyAuditAnnotation({id: 'selection', ...fixture({}), generator: {
            schema: {}, spec: {generalLabels: labels, inferredLabels: [{produces: [Scope.NumbersWithoutZero], infer: () => [Scope.NumbersWithoutZero]}]}
        }, view: {schema: {unknown: ontologyNeutral(unknown)}, spec: {generalLabels: []}}});
        expect(resolved.annotationResolution.status).toBe('exhaustive');
        expect(unknown).not.toHaveBeenCalled();
    });

    it('keeps contract failures invalid instead of treating produces as a fallback', () => {
        const resolved = resolveDependencyAuditAnnotation({id: 'invalid-selection', ...fixture({}), generator: {
            schema: {}, spec: {generalLabels: labels, inferredLabels: [{produces: [Scope.NumbersWithZero], infer: () => [Scope.NumbersWithoutZero]}]}
        }});
        expect(resolved.annotationResolution.status).toBe('invalid');
        expect(resolved.issues).toHaveLength(1);
        expect(resolved.labels).toEqual([...labels].sort());
    });

    it.each([null, {}, 'invalid', [null], [{produces: [Scope.NumbersWithZero]}]])(
        'rejects a malformed defined inference declaration instead of reporting not_required: %j', inferredLabels => {
            const resolved = resolveDependencyAuditAnnotation({id: 'invalid-declaration', ...fixture({}), generator: {
                schema: {}, spec: {generalLabels: labels, inferredLabels: inferredLabels as never}
            }});
            expect(resolved.annotationResolution.status).toBe('invalid');
            expect(resolved.issues?.[0]).toContain('SPEC-12');
            expect(resolved.labels).toEqual([...labels].sort());
        });

    it('rejects cross-owner inference/schema overlap before resolving config or running inference', () => {
        const resolver = vi.fn(() => 7);
        const infer = vi.fn(() => [Scope.NumbersWithZero]);
        const schema = {unknown: ontologyNeutral(resolver)};
        const resolved = resolveDependencyAuditAnnotation({id: 'ownership-error', ...fixture(schema), generator: {
            schema, spec: {generalLabels: labels, inferredLabels: [{produces: [Scope.NumbersWithZero], infer}]}
        }, view: {schema: {zero: [Scope.NumbersWithZero, Scope.NumbersWithoutZero]}, spec: {generalLabels: []}}});
        expect(resolved.annotationResolution.status).toBe('invalid');
        expect(resolver).not.toHaveBeenCalled();
        expect(infer).not.toHaveBeenCalled();
        expect(resolved.labels).toEqual([...labels].sort());
    });
});
