import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {VolumeRectangularPrismGenerator} from './generator.ts';
import {VolumeRectangularPrismGeneratorSchema, spec} from './spec.ts';

const profileCases = [
    [[Area.MeasuringVolumes, Area.Equation, Scope.CubeScale], 'packing-equivalence'],
    [[Scope.CubeScale, Scope.ThreeOperands], 'triple-product'],
    [[Scope.CubeScale, Scope.ThreeOperands, Area.AssociativeLaw], 'associative-triple-product'],
    [[Area.Equation, Scope.ThreeOperands], 'edge-formula'],
    [[Area.Equation, Scope.TwoOperands], 'base-area-formula']
] as const;

const commonLabels = [
    Area.VolumeCalculation,
    Area.RectangularPrism,
    Area.Multiplication,
    Scope.IntegerNumbers
] as const;

describe('volume-rectangular-prism schema integration', () => {
    it('owns the invariant prism mathematics without an Ability claim', () => {
        expect(spec.generalLabels).toEqual(commonLabels);
        for (const label of Object.values(Ability)) expect(spec.generalLabels).not.toContain(label);
    });

    it.each(profileCases)('resolves exact mathematical profile %s to %s', (labels, relationProfile) => {
        const resolution = extractConfig(VolumeRectangularPrismGeneratorSchema, [...commonLabels, ...labels]);
        expect(resolution.config.relationProfile).toBe(relationProfile);
        expect(new Set(resolution.resolvedLabels)).toEqual(new Set<string>(labels));
        const generated = generateWithLabels(new VolumeRectangularPrismGenerator(), [...commonLabels, ...labels])!;
        for (const label of labels) expect(generated.labels).toContain(label);
        expect(generated.data.kind).toBe('rectangular-prism-volume');
    });

    it('resolves all seven authored target permutations without using their Abilities', () => {
        const paths = [
            {labels: [...profileCases[0][0], Ability.ProcedureUnderstanding, Ability.Formalization],
                profile: 'packing-equivalence'},
            {labels: [...profileCases[1][0], Ability.VisualArticulation], profile: 'triple-product'},
            {labels: [...profileCases[2][0], Ability.VisualArticulation], profile: 'associative-triple-product'},
            ...[false, true].flatMap(story => [
                {labels: [...profileCases[3][0], Ability.ProcedureExecution,
                    ...(story ? [Ability.TextualReception] : [])], profile: 'edge-formula'},
                {labels: [...profileCases[4][0], Ability.ProcedureExecution,
                    ...(story ? [Ability.TextualReception] : [])], profile: 'base-area-formula'}
            ])
        ];
        expect(paths).toHaveLength(7);
        for (const {labels, profile} of paths) {
            const config = extractConfig(VolumeRectangularPrismGeneratorSchema, [...commonLabels, ...labels]);
            expect(config.config.relationProfile).toBe(profile);
            expect(new Set(config.resolvedLabels)).toEqual(new Set(labels.filter(label =>
                !Object.values(Ability).includes(label as typeof Ability[keyof typeof Ability]))));
        }
    });

    it('rejects an unsupported cube-scale two-operand conjunction', () => {
        expect(() => extractConfig(VolumeRectangularPrismGeneratorSchema, [
            Scope.CubeScale, Scope.TwoOperands
        ])).toThrow();
    });
});
