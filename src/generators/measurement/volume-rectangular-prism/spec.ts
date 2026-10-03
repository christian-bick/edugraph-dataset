import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const relationProfiles = [
    [[Area.MeasuringVolumes, Area.Equation, Scope.CubeScale], 'packing-equivalence'],
    [[Scope.CubeScale, Scope.ThreeOperands], 'triple-product'],
    [[Scope.CubeScale, Scope.ThreeOperands, Area.AssociativeLaw], 'associative-triple-product'],
    [[Area.Equation, Scope.ThreeOperands], 'edge-formula'],
    [[Area.Equation, Scope.TwoOperands], 'base-area-formula']
] as const;

const resolveRelationProfile = selectExactLabelSetMap(relationProfiles);

export const spec: GeneratorSpec = {
    generatorId: 'volume-rectangular-prism',
    generalLabels: [
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.Multiplication,
        Scope.IntegerNumbers
    ]
};

export const VolumeRectangularPrismGeneratorSchema = {
    relationProfile: [[
        Area.MeasuringVolumes,
        Area.Equation,
        Area.AssociativeLaw,
        Scope.CubeScale,
        Scope.ThreeOperands,
        Scope.TwoOperands
    ], resolveRelationProfile, relationProfiles.map(([labels]) => labels)]
} as const;

export type VolumeRectangularPrismGeneratorConfig = ConfigFromSchema<
    typeof VolumeRectangularPrismGeneratorSchema
>;
