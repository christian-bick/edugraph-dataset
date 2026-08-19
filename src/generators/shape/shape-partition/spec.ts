import {Area, Scope} from 'edugraph-ts';
import {hasLabel, matchAllExactLabels} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-partition',
    generalLabels: [
        Scope.EqualShares
    ]
};

export const ShapePartitionGeneratorSchema = {
    taskAreas: [
        [
            Area.ProportionSense,
            Area.ShapeDecomposition,
            Area.FractionInterpretation,
            Area.FractionCommonNumeratorComparison
        ],
        matchAllExactLabels
    ],
    shape: [Area.Circle, Area.Rectangle],
    fractionTypes: [
        [Scope.UnitFractions, Scope.NonUnitFractions],
        matchAllExactLabels
    ],
    fractionNotation: [
        [Area.FractionNotation],
        hasLabel(Area.FractionNotation)
    ],
    isLessComparison: [
        [Scope.Less],
        hasLabel(Scope.Less)
    ]
} as const;

export type ShapePartitionGeneratorConfig = ConfigFromSchema<typeof ShapePartitionGeneratorSchema>;
