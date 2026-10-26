import { describe, expect, it } from 'vitest';
import { Ability, Area, Scope } from 'edugraph-ts';
import { extractConfig, extractSchemaLabels } from '../../../../lib/utils.ts';
import { setSeed } from '../../../../lib/random.ts';
import { matchTarget } from '../../../../lib/matching.ts';
import { resolvePlannedConfigurations } from '../../../../lib/planned-generation.ts';
import { CountingBasicGeneratorSchema, spec as generatorSpec } from '../../../../generators/counting/counting-basic/spec.ts';
import { CountingObjectsSimpleViewSchema, spec } from './spec.ts';

describe('CountingObjectsSimpleViewSchema', () => {
    it('adds the requested explanation capability without requiring a new target claim', () => {
        const target = {id: 'count-existing-target', labels: [Area.NumerationWithIntegers,
            Scope.NumbersSmaller10, Scope.ScatteredArrangement, Ability.ProcedureExecution]};
        const matched = matchTarget(target, {
            generatorId: generatorSpec.generatorId, spec: generatorSpec, schema: CountingBasicGeneratorSchema,
            generalLabels: generatorSpec.generalLabels,
            labels: [...generatorSpec.generalLabels, ...extractSchemaLabels(CountingBasicGeneratorSchema)],
            problemType: 'CountingProblem'
        }, {
            viewId: spec.viewId, spec, schema: CountingObjectsSimpleViewSchema, generalLabels: spec.generalLabels,
            supportedLabels: [...spec.generalLabels, ...extractSchemaLabels(CountingObjectsSimpleViewSchema)],
            problemType: 'CountingProblem'
        });
        expect(matched.matched).toBe(true);
        if (!matched.matched) throw new Error('Existing counting target stopped matching.');
        const resolved = resolvePlannedConfigurations({generatorSchema: CountingBasicGeneratorSchema,
            viewSchema: CountingObjectsSimpleViewSchema, plan: matched.plan,
            sampleKey: `${target.id}#counting-basic#counting-objects-simple#train#question#inst:0`, attempt: 1, seed: 42});

        expect(matched.plan.targetLabels).toEqual([...target.labels].sort());
        expect(target.labels).not.toContain(Ability.TextualArticulation);
        expect(resolved.labels).toEqual(expect.arrayContaining([...target.labels,
            Ability.ProcedureUnderstanding, Ability.TextualArticulation, Scope.ArabicNumerals, Scope.Base10]));
        expect(resolved.view.config.arrangement).toBe(Scope.ScatteredArrangement);
    });

    it('resolves exactly one box arrangement capability', () => {
        setSeed(42);
        const {config, resolvedLabels} = extractConfig(
            CountingObjectsSimpleViewSchema,
            [Scope.BoxArrangement]
        );

        expect(config.arrangement).toBe(Scope.BoxArrangement);
        expect(resolvedLabels).toEqual([Scope.BoxArrangement]);
    });

    it.each([
        Scope.LinearArrangement,
        Scope.CircularArrangement,
        Scope.ScatteredArrangement
    ])('resolves %s without an additional arrangement label', arrangement => {
        const {config, resolvedLabels} = extractConfig(
            CountingObjectsSimpleViewSchema,
            [arrangement]
        );

        expect(config.arrangement).toBe(arrangement);
        expect(resolvedLabels).toEqual([arrangement]);
    });
});
