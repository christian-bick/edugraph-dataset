import {Area, Scope} from 'edugraph-ts';
import {hasLabel, matchAllExactLabels} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'area-decomposition',
    compatibility: [generatorLabelRule('distributive-area-features', [
        Area.DistributiveLaw, Area.Multiplication, Scope.ThreeOperands
    ], selected => !selected(Area.DistributiveLaw)
        || selected(Area.Multiplication) && selected(Scope.ThreeOperands))],
    generalLabels: [
        Area.AreaCalculation,
        Area.Rectangle,
        Area.ShapeDecomposition,
        Area.Addition
    ]
};

export const AreaDecompositionGeneratorSchema = {
    useDistributiveModel: [[Area.DistributiveLaw], hasLabel(Area.DistributiveLaw)],
    distributiveFeatures: [
        [Area.Multiplication, Scope.ThreeOperands],
        matchAllExactLabels
    ]
} as const;

export type AreaDecompositionGeneratorConfig = ConfigFromSchema<
    typeof AreaDecompositionGeneratorSchema
>;
