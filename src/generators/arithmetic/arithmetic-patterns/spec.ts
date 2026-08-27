import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
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

const modelLabelSets = [
    [Area.PatternGeneration],
    [Area.EmergentFeatureRecognition],
    [Area.GenerativeRuleRecognition]
] as const;

const resolveModel = selectExactLabelSetMap([
    [[Area.PatternGeneration], 'recurrence'],
    [[Area.EmergentFeatureRecognition], 'recurrence'],
    [[Area.PatternGeneration, Area.EmergentFeatureRecognition], 'recurrence'],
    [[Area.GenerativeRuleRecognition], 'operation-table']
] as const);

const resolveOperation = selectExactLabelMap([
    [Area.Addition, 'addition'],
    [Area.Multiplication, 'multiplication']
] as const);

export const ArithmeticPatternsGeneratorSchema = {
    model: [[
        Area.PatternGeneration,
        Area.GenerativeRuleRecognition,
        Area.EmergentFeatureRecognition
    ], resolveModel, modelLabelSets],
    operation: [[Area.Addition, Area.Multiplication], resolveOperation],
    useCommutativeLaw: [[Area.CommutativeLaw], hasLabel(Area.CommutativeLaw)],
    useAssociativeLaw: [[Area.AssociativeLaw], hasLabel(Area.AssociativeLaw)],
    useDistributiveLaw: [[Area.DistributiveLaw], hasLabel(Area.DistributiveLaw)]
} as const;

export type ArithmeticPatternsGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticPatternsGeneratorSchema
>;
