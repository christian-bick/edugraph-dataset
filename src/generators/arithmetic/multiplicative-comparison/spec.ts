import {Area, Scope} from 'edugraph-ts';
import {selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'multiplicative-comparison',
    generalLabels: [
        Area.ProportionalScaling,
        Scope.SingleStep,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const MultiplicativeComparisonGeneratorSchema = {
    operation: [
        [Area.Multiplication, Area.Division],
        selectCanonicalLabel([
            [[Area.Multiplication], 'multiplication'],
            [[Area.Division], 'division']
        ])
    ]
} as const;

export type MultiplicativeComparisonGeneratorConfig = ConfigFromSchema<
    typeof MultiplicativeComparisonGeneratorSchema
>;
