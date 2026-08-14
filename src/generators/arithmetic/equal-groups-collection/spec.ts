import {Area, Scope} from 'edugraph-ts';
import {selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'equal-groups-collection',
    generalLabels: [
        Area.GroupRecognition,
        Scope.EqualShares,
        Scope.TwoOperands,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100
    ]
};

export const EqualGroupsCollectionGeneratorSchema = {
    operation: [
        [Area.Multiplication, Area.PartitiveDivision, Area.QuotativeDivision],
        selectCanonicalLabel([
            [[Area.Multiplication], 'multiplication'],
            [[Area.PartitiveDivision], 'partitive-division'],
            [[Area.QuotativeDivision], 'quotative-division']
        ])
    ]
} as const;

export type EqualGroupsCollectionGeneratorConfig = ConfigFromSchema<
    typeof EqualGroupsCollectionGeneratorSchema
>;
