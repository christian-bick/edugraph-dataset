import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {WritingGeneratorSchema, spec as writingSpec} from '../../../../generators/writing/spec.ts';
import {spec as gradeTwoTargets} from '../../../../spec/ccss/grade-02.ts';
import {implementationTodos, spec as gradeSixTargets} from '../../../../spec/ccss/grade-06.ts';
import type {CompetencyTarget} from '../../../../types/ml-engine.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsNumberLineRepresentationViewSchema, spec} from './spec.ts';

const generator = {generatorId: writingSpec.generatorId, generalLabels: writingSpec.generalLabels,
    schema: WritingGeneratorSchema, spec: writingSpec};
const view = (declaration: ViewSpec) => ({viewId: declaration.viewId, generalLabels: declaration.generalLabels,
    schema: OperationsNumberLineRepresentationViewSchema, spec: declaration});
const unguarded = {...spec, compatibility: spec.compatibility?.filter(rule => rule.id !== 'number-line-bounded-domain')};
const actualTarget = (targets: readonly CompetencyTarget[], id: string): CompetencyTarget => {
    const target = targets.find(candidate => candidate.id === id);
    if (!target) throw new Error(`Missing authored regression target: ${id}`);
    return target;
};

describe('operations-number-line-representation view spec', () => {
    it('owns invariant visual articulation on a number line', () => {
        expect(spec.generalLabels).toEqual([Scope.Numberline, Ability.VisualArticulation]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Scope.NumbersSmaller100]);
        expect(OperationsNumberLineRepresentationViewSchema).toEqual({});
    });

    it('preserves the actual bounded Grade 2 target and its exact prior generation plan', () => {
        const target = actualTarget(gradeTwoTargets, '2.MD.B.6-number-line-representation~5cfb1e4b');
        expect(target.labels).toContain(Scope.NumbersSmaller100);
        const previous = planModelCompatibility(target, generator, view(unguarded));
        const guarded = planModelCompatibility(target, generator, view(spec));
        expect(previous.supported).toBe(true);
        expect(guarded.supported).toBe(true);
        if (!previous.supported || !guarded.supported) throw new Error('The bounded Grade 2 target must remain supported.');
        expect(guarded.plan.hash).toBe(previous.plan.hash);
        expect(guarded.plan).toEqual(previous.plan);
    });

    it('excludes the actual unbounded Grade 6 target from this bounded legacy view', () => {
        const target = actualTarget([...gradeSixTargets, ...implementationTodos],
            '6.NS.C.6c-rational-numberline-positioning~97edc36e');
        expect(target.labels).not.toContain(Scope.NumbersSmaller100);
        expect(planModelCompatibility(target, generator, view(unguarded)).supported).toBe(true);
        const guarded = planModelCompatibility(target, generator, view(spec));
        expect(guarded.supported).toBe(false);
        if (guarded.supported) throw new Error('An unbounded target cannot use the 0..100 legacy view.');
        expect(guarded.reason).toBe('incompatible-rules');
        if (guarded.reason === 'incompatible-rules') expect(guarded.ruleIds).toContain('view:number-line-bounded-domain');
    });
});
