import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'number-array',
    generalLabels: [
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100
    ]
};

export const NumberArrayGeneratorSchema = {
    operation: [
        [Area.Addition, Area.Multiplication, Area.PartitiveDivision, Area.QuotativeDivision],
        selectExactLabelMap([
            [Area.Addition, 'addition'],
            [Area.Multiplication, 'multiplication'],
            [Area.PartitiveDivision, 'partitive-division'],
            [Area.QuotativeDivision, 'quotative-division']
        ])
    ],
    requireTwoOperands: [
        [Scope.TwoOperands],
        hasLabel(Scope.TwoOperands)
    ],
    requireIteratedOperation: [
        [Area.IteratedOperation],
        hasLabel(Area.IteratedOperation)
    ]
} as const;

export type NumberArrayGeneratorConfig = ConfigFromSchema<typeof NumberArrayGeneratorSchema>;
