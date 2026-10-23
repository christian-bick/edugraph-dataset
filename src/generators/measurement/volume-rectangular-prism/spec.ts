import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

const relationProfiles = [
    [[Area.MeasuringVolumes, Scope.CubeScale], 'packing-count'],
    [[Area.MeasuringVolumes, Area.Equation, Scope.CubeScale], 'packing-equivalence'],
    [[Scope.CubeScale, Scope.ThreeOperands], 'triple-product'],
    [[Scope.CubeScale, Scope.ThreeOperands, Area.AssociativeLaw], 'associative-triple-product'],
    [[Area.Equation, Scope.ThreeOperands], 'edge-formula'],
    [[Area.Equation, Scope.TwoOperands], 'base-area-formula']
] as const;

const resolveRelationProfile = selectExactLabelSetMap(relationProfiles);
const numberDomains = [[[Scope.IntegerNumbers], 'integer'], [[Scope.FractionNumbers], 'fractional']] as const;

export const spec: GeneratorSpec = {
    generatorId: 'volume-rectangular-prism',
    generalLabels: [
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.Multiplication
    ],
    compatibility: [generatorLabelRule('fractional-prism-bare-packing-domain',
        [Area.MeasuringVolumes, Area.Equation, Scope.FractionNumbers],
        selected => !selected(Area.MeasuringVolumes) || selected(Area.Equation) || selected(Scope.FractionNumbers))]
};

export const VolumeRectangularPrismGeneratorSchema = {
    relationProfile: [[
        Area.MeasuringVolumes,
        Area.Equation,
        Area.AssociativeLaw,
        Scope.CubeScale,
        Scope.ThreeOperands,
        Scope.TwoOperands
    ], resolveRelationProfile, relationProfiles.map(([labels]) => labels)],
    numberDomain: [[Scope.IntegerNumbers, Scope.FractionNumbers], selectExactLabelSetMap(numberDomains),
        numberDomains.map(([labels]) => labels)]
} as const;

export type VolumeRectangularPrismGeneratorConfig = ConfigFromSchema<
    typeof VolumeRectangularPrismGeneratorSchema
>;
