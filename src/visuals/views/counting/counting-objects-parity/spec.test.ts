import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ParityGroupingGeneratorSchema, spec as generatorSpec} from '../../../../generators/counting/parity-grouping/spec.ts';
import {matchTarget} from '../../../../lib/matching.ts';
import {enumerateDependencyAuditSelections} from '../../../../lib/label-dependency-audit.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../../lib/planned-generation.ts';
import {ParityGroupingGenerator} from '../../../../generators/counting/parity-grouping/generator.ts';
import {extractSchemaLabels} from '../../../../lib/utils.ts';
import {createLabelDependencyEvaluator} from '../../../../lib/label-dependencies.ts';
import {CountingObjectsParityViewSchema, spec} from './spec.ts';

describe('counting-objects-parity capabilities', () => {
    it.each([Scope.EvenNumbers, Scope.OddNumbers])('preserves an existing %s target while annotating visible numerals', parity => {
        const target = {id: `parity-${parity.split('/').pop()}`, labels: [Area.NumerationWithIntegers,
            Scope.NumbersSmaller20, parity, Ability.ConceptClassification]};
        const generator = {
            generatorId: generatorSpec.generatorId, spec: generatorSpec, schema: ParityGroupingGeneratorSchema,
            generalLabels: generatorSpec.generalLabels,
            labels: [...generatorSpec.generalLabels, ...extractSchemaLabels(ParityGroupingGeneratorSchema)],
            problemType: 'ParityGroupingProblem'
        };
        const view = {
            viewId: spec.viewId, spec, schema: CountingObjectsParityViewSchema, generalLabels: spec.generalLabels,
            supportedLabels: [...spec.generalLabels], problemType: 'ParityGroupingProblem'
        };
        const matched = matchTarget(target, generator, view);
        expect(matched.matched).toBe(true);
        if (!matched.matched) throw new Error('Existing parity target stopped matching.');
        const resolved = resolvePlannedConfigurations({generatorSchema: ParityGroupingGeneratorSchema,
            viewSchema: CountingObjectsParityViewSchema, plan: matched.plan,
            sampleKey: `${target.id}#parity-grouping#counting-objects-parity#train#question#inst:0`, attempt: 1, seed: 42});

        expect(matched.plan.targetLabels).toEqual([...target.labels].sort());
        expect(target.labels).not.toContain(Scope.ArabicNumerals);
        expect(resolved.labels).toEqual(expect.arrayContaining([...target.labels, Scope.ArabicNumerals,
            Scope.Base10, Scope.PhysicalNumbers]));
        expect(resolved.view.config).toEqual({});
        expect(generatorSpec.generalLabels).not.toContain(Scope.NumbersWithoutZero);
        expect(resolved.labels.includes(Scope.NumbersWithZero)).toBe(resolved.generatorConfig.parity !== 'positive-odd');
        expect(resolved.labels.includes(Scope.NumbersWithoutZero)).toBe(resolved.generatorConfig.parity === 'positive-odd');
        expect(matchTarget({...target, labels: [...target.labels, Scope.NumbersWithoutZero]}, generator, view))
            .toMatchObject({matched: parity === Scope.OddNumbers});
        expect(matchTarget({...target, labels: [...target.labels, Scope.NumbersWithZero]}, generator, view).matched)
            .toBe(parity === Scope.EvenNumbers);
        // The odd zero-involving singleton belongs to the canonical U5 band.
        expect(matchTarget({...target, labels: target.labels.map(label => label === Scope.NumbersSmaller20
            ? Scope.NumbersSmaller5 : label).concat(Scope.NumbersWithZero)}, generator, view).matched).toBe(true);
        // Evaluation is stateless; retain one ontology-bound index for every
        // original annotation assessment in this independently timed case.
        const evaluator = createLabelDependencyEvaluator();
        const assessment = evaluator.evaluate(resolved.labels)
            .assessments.find(item => item.facet === 'zero');
        expect(assessment?.status).toBe('satisfied');
        const variants = enumerateDependencyAuditSelections(matched.plan);
        expect(variants.status).toBe('complete');
        const zeroLabels: readonly string[] = [Scope.NumbersWithZero, Scope.NumbersWithoutZero];
        for (const variant of variants.selections) {
            expect(variant.labels.filter(label => zeroLabels.includes(label)))
                .toHaveLength(1);
            expect(evaluator.evaluate(variant.labels)
                .assessments.find(item => item.facet === 'zero')?.status).toBe('satisfied');
        }

        for (const mode of ['question', 'solution'] as const) {
            const draw = generatePlannedDraw({generator: new ParityGroupingGenerator(), viewSchema: CountingObjectsParityViewSchema,
                plan: matched.plan, sampleKey: `${target.id}#parity-grouping#counting-objects-parity#train#${mode}#inst:0`,
                attempt: 1, seed: 42});
            expect(draw.stub).not.toBeNull();
            expect(draw.labels).toEqual(resolved.labels);
            expect(draw.view).toEqual(resolved.view);
            expect(draw.labels.includes(Scope.NumbersWithZero)).toBe(draw.stub!.data.groupSize === 0 || draw.stub!.data.remainder === 0);
            expect(draw.labels.includes(Scope.NumbersWithoutZero)).toBe(draw.stub!.data.groupSize > 0 && draw.stub!.data.remainder > 0);
        }
    });
});
