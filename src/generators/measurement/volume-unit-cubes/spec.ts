import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const resolveUnitId = selectExactLabelSetMap([
    [[], 'generic'],
    [[Scope.CubicCentimeterScale], 'cm'],
    [[Scope.CubicInchScale], 'in'],
    [[Scope.CubicFootScale], 'ft']
] as const);

const resolveCountingModel = selectExactLabelSetMap([
    [[], 'unindexed'],
    [[Area.Numeration, Scope.IntegerNumbers], 'enumerated']
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'volume-unit-cubes',
    generalLabels: [
        Area.Cube,
        Area.MeasuringVolumes,
        Scope.CubeScale
    ]
};

export const VolumeUnitCubesGeneratorSchema = {
    unitId: [[
        Scope.CubicCentimeterScale,
        Scope.CubicInchScale,
        Scope.CubicFootScale
    ], resolveUnitId],
    countingModel: [
        [Area.Numeration, Scope.IntegerNumbers],
        resolveCountingModel,
        [[], [Area.Numeration, Scope.IntegerNumbers]]
    ]
} as const;

export type VolumeUnitCubesGeneratorConfig = ConfigFromSchema<typeof VolumeUnitCubesGeneratorSchema>;
