import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec<typeof ArithmeticEquationJudgmentGeneratorSchema> = {
    generatorId: 'arithmetic-equation-judgment',
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ],
    // SPEC-12: a false predicate is not an unconditional absence declaration.
    // Positive addition has answer >= 2, so both neighboring judgment claims stay positive.
    // Positive subtraction can have answer 1 and display the false claim 0.
    inferredLabels: [{
        produces: [Scope.NumbersWithoutZero],
        infer: ({operation, requireZero}) => operation === Area.Addition && !requireZero
            ? [Scope.NumbersWithoutZero] : []
    }]
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
