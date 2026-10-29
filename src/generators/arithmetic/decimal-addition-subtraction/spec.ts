import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-addition-subtraction',
    generalLabels: [
        Area.PlaceValue,
        Scope.HundredthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.TwoOperands
    ]
};

const resolveOperation = selectExactLabelMap([
    [Area.Addition, 'addition'],
    [Area.Subtraction, 'subtraction']
] as const);

export const DecimalAdditionSubtractionGeneratorSchema = {
    operation: [[Area.Addition, Area.Subtraction], resolveOperation],
    zeroPresence: [[Scope.NumbersWithZero, Scope.NumbersWithoutZero], selectExactLabelMap([
        [Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]
    ] as const)]
} as const;

export type DecimalAdditionSubtractionGeneratorConfig = ConfigFromSchema<
    typeof DecimalAdditionSubtractionGeneratorSchema
>;
