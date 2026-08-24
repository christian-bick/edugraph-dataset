import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-patterns',
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

const resolveModel = selectCanonicalLabel([
    [[Area.PatternGeneration, Area.EmergentFeatureRecognition], 'recurrence'],
    [[Area.GenerativeRuleRecognition], 'operation-table']
] as const);

const resolveOperation = selectCanonicalLabel([
    [[Area.Addition], 'addition'],
    [[Area.Multiplication], 'multiplication']
] as const);

export const ArithmeticPatternsGeneratorSchema = {
    model: [[
        Area.PatternGeneration,
        Area.GenerativeRuleRecognition,
        Area.EmergentFeatureRecognition
    ], resolveModel],
    operation: [[Area.Addition, Area.Multiplication], resolveOperation],
    useCommutativeLaw: [[Area.CommutativeLaw], hasLabel(Area.CommutativeLaw)],
    useAssociativeLaw: [[Area.AssociativeLaw], hasLabel(Area.AssociativeLaw)],
    useDistributiveLaw: [[Area.DistributiveLaw], hasLabel(Area.DistributiveLaw)]
} as const;

export type ArithmeticPatternsGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticPatternsGeneratorSchema
>;
