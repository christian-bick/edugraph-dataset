import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-equation-judgment',
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const ArithmeticEquationJudgmentGeneratorSchema = {
    operation: [Area.Addition, Area.Subtraction],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100]),
        resolveRangeFromLabels
    ]
} as const;

export type ArithmeticEquationJudgmentGeneratorConfig = ConfigFromSchema<typeof ArithmeticEquationJudgmentGeneratorSchema>;
