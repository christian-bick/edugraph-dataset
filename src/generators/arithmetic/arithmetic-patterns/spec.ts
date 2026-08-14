import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveExplicitOperation} from '../helpers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-patterns',
    generalLabels: [
        Area.PatternRecognition,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const ArithmeticPatternsGeneratorSchema = {
    operation: [[Area.Addition, Area.Multiplication], resolveExplicitOperation],
    useCommutativeLaw: [[Area.CommutativeLaw], hasLabel(Area.CommutativeLaw)],
    useAssociativeLaw: [[Area.AssociativeLaw], hasLabel(Area.AssociativeLaw)],
    useDistributiveLaw: [[Area.DistributiveLaw], hasLabel(Area.DistributiveLaw)]
} as const;

export type ArithmeticPatternsGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticPatternsGeneratorSchema
>;
