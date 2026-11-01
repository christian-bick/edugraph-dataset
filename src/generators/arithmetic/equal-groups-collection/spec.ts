import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {equalGroupsRangeChoices, equalGroupsRangeLabels, resolveEqualGroupsRange} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'equal-groups-collection',
    generalLabels: [
        Area.GroupRecognition,
        Scope.EqualShares,
        Scope.TwoOperands,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.IntegerNumbers,
        Scope.SingleDigitSmallestOperand
    ]
};

export const EqualGroupsCollectionGeneratorSchema = {
    operation: [
        [Area.Multiplication, Area.PartitiveDivision, Area.QuotativeDivision],
        selectExactLabelMap([
            [Area.Multiplication, 'multiplication'],
            [Area.PartitiveDivision, 'partitive-division'],
            [Area.QuotativeDivision, 'quotative-division']
        ])
    ],
    range: [equalGroupsRangeLabels, resolveEqualGroupsRange, equalGroupsRangeChoices]
} as const;

export type EqualGroupsCollectionGeneratorConfig = ConfigFromSchema<
    typeof EqualGroupsCollectionGeneratorSchema
>;
