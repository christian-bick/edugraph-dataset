import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-patterns',
    compatibility: [generatorLabelRule('pattern-property-law', [
        Area.CommutativeLaw, Area.AssociativeLaw, Area.DistributiveLaw, Area.Multiplication
    ], selected => Number(selected(Area.CommutativeLaw)) + Number(selected(Area.AssociativeLaw))
        + Number(selected(Area.DistributiveLaw)) <= 1
        && (!selected(Area.DistributiveLaw) || selected(Area.Multiplication)))],
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

const resolveOperation = selectExactLabelMap([
    [Area.Addition, 'addition'],
    [Area.Multiplication, 'multiplication']
] as const);

export const ArithmeticPatternsGeneratorSchema = {
    operation: [[Area.Addition, Area.Multiplication], resolveOperation],
    useCommutativeLaw: [[Area.CommutativeLaw], hasLabel(Area.CommutativeLaw)],
    useAssociativeLaw: [[Area.AssociativeLaw], hasLabel(Area.AssociativeLaw)],
    useDistributiveLaw: [
        [Area.DistributiveLaw, Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        selectExactLabelSetMap([
            [[], false],
            [[Scope.NumbersWithoutZero], false],
            [[Area.DistributiveLaw], true],
            [[Area.DistributiveLaw, Scope.NumbersWithZero], true]
        ] as const),
        [[Area.DistributiveLaw, Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]
    ]
} as const;

export type ArithmeticPatternsGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticPatternsGeneratorSchema
>;
