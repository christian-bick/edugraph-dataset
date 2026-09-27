import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {sampleGenerationPlan} from '../../lib/compatibility.ts';
import {planModelCompatibility, type ViewChoiceModel} from '../../lib/model-compatibility.ts';
import {bindingsForSelection} from '../../lib/planned-generation.ts';
import {resolveSchemaChoices} from '../../lib/schema-choices.ts';
import {countingOffsetStarts, type CountingOffsetOperandProfile} from './counting-offset.ts';
import {CountingIncDecGeneratorSchema, spec as oneSpec} from './counting-inc-dec/spec.ts';
import {CountingTenOffsetGeneratorSchema, spec as tenSpec} from './counting-ten-offset/spec.ts';
import {CountingHundredOffsetGeneratorSchema, spec as hundredSpec} from './counting-hundred-offset/spec.ts';

const view: ViewChoiceModel = {
    viewId: 'offset-evidence', generalLabels: [], schema: {},
    spec: {viewId: 'offset-evidence', generalLabels: []}
};
const lowerBounds = [
    [Scope.NumbersLargerZero, 0], [Scope.NumbersLarger5, 5], [Scope.NumbersLarger10, 10],
    [Scope.NumbersLarger20, 20], [Scope.NumbersLarger100, 100], [Scope.NumbersLarger120, 120]
] as const;
const upperBounds = [
    [Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20],
    [Scope.NumbersSmaller100, 100], [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000]
] as const;
const profiles: readonly [readonly string[], CountingOffsetOperandProfile, number | null][] = [
    [[], 'unrestricted', null], [[Scope.TwoDigitLargestOperand], 'two-digit', 2],
    [[Scope.ThreeDigitLargestOperand], 'three-digit', 3]
];
const modules = [
    {step: 1, schema: CountingIncDecGeneratorSchema, spec: oneSpec, profiles: profiles.slice(0, 1)},
    {step: 10, schema: CountingTenOffsetGeneratorSchema, spec: tenSpec, profiles},
    {step: 100, schema: CountingHundredOffsetGeneratorSchema, spec: hundredSpec, profiles: [profiles[0], profiles[2]]}
] as const;

describe('counting offset semantic feasibility', () => {
    it.each(modules)('plans exactly the feasible selected labels for offset $step', ({step, schema, spec, profiles: supportedProfiles}) => {
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        for (const [lower, min] of lowerBounds) {
            for (const [upper, max] of upperBounds.filter(([label]) => (schema.range[0] as readonly string[]).includes(label))) {
                for (const [profileLabels, operandProfile, digitCount] of supportedProfiles) {
                    for (const [label, direction] of [[Area.Increment, 'inc'], [Area.Decrement, 'dec']] as const) {
                        const labels = [lower, upper, label, ...profileLabels];
                        const context = `${spec.generatorId}: ${JSON.stringify({min, max, direction, operandProfile})}`;
                        const expectedStarts = Array.from({length: max}, (_, index) => index + 1).filter(start => {
                            const result = direction === 'inc' ? start + step : start - step;
                            return [start, step, result].every(value => value >= min && value <= max)
                                && result > 0 && !/0/.test(`${start}${result}`)
                                && (digitCount === null || start >= step && String(start).length === digitCount);
                        });
                        const planned = planModelCompatibility({id: 'offset-domain', labels}, model, view);
                        expect(planned.supported, context).toBe(expectedStarts.length > 0);
                        expect(countingOffsetStarts({range: {min, max}, direction}, step, operandProfile), context)
                            .toEqual(expectedStarts);
                        if (!planned.supported) continue;
                        const bindings = bindingsForSelection(planned.plan, sampleGenerationPlan(planned.plan, () => 0));
                        const resolved = resolveSchemaChoices(schema, labels, bindings.generator);
                        expect(resolved.config.range, context).toEqual({min, max});
                        expect(resolved.config.direction, context).toBe(direction);
                        if ('operandProfile' in resolved.config) expect(resolved.config.operandProfile, context).toBe(operandProfile);
                        expect(resolved.resolvedLabels, context).toEqual(expect.arrayContaining(labels));
                    }
                }
            }
        }
    });

    it.each([
        [10, CountingTenOffsetGeneratorSchema, tenSpec, Scope.TwoDigitLargestOperand, Scope.NumbersSmaller20],
        [100, CountingHundredOffsetGeneratorSchema, hundredSpec, Scope.ThreeDigitLargestOperand, Scope.NumbersSmaller120]
    ] as const)('keeps only a feasible direction for a tight profiled offset %i request', (step, schema, spec, profile, upper) => {
        const labels = [Scope.NumbersLargerZero, upper, profile];
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const planned = planModelCompatibility({id: 'tight-offset', labels}, model, view);
        expect(planned.supported).toBe(true);
        if (!planned.supported) throw new Error(planned.reason);
        for (const draw of [0, 0.5, 0.999]) {
            const bindings = bindingsForSelection(planned.plan, sampleGenerationPlan(planned.plan, () => draw));
            const resolved = resolveSchemaChoices(schema, labels, bindings.generator);
            expect(resolved.config.direction).toBe('dec');
            expect(resolved.resolvedLabels).toContain(Area.Decrement);
            expect(countingOffsetStarts(resolved.config, step, resolved.config.operandProfile!)).not.toEqual([]);
        }
    });

    it('rejects every one-step direction bundle when the selected lower bound excludes one', () => {
        const choices = CountingIncDecGeneratorSchema.direction[1].labelChoices!;
        if (choices.kind !== 'alternatives') throw new Error('Expected explicit direction alternatives');
        expect(choices.alternatives).toHaveLength(6);
        for (const direction of choices.alternatives!) {
            const labels = [Scope.NumbersLarger5, Scope.NumbersSmaller20, ...direction];
            const planned = planModelCompatibility({id: 'unit-operand-bound', labels}, {
                generatorId: oneSpec.generatorId, generalLabels: oneSpec.generalLabels,
                schema: CountingIncDecGeneratorSchema, spec: oneSpec
            }, view);
            expect(planned.supported).toBe(false);
            if (planned.supported) throw new Error('The fixed operand 1 is outside the requested range');
            expect(planned.ruleIds).toContain('generator:offset-1-operand-in-range');
        }
    });
});
