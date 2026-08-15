import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveTwoStepOperations} from '../helpers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-word-problems-two-step',
    generalLabels: [
        Scope.MultiStep,
        Scope.MultiLevelComposition,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const ArithmeticWordProblemsTwoStepGeneratorSchema = {
    operations: [
        [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division],
        resolveTwoStepOperations
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type ArithmeticWordProblemsTwoStepGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticWordProblemsTwoStepGeneratorSchema
>;
