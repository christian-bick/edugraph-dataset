import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveTwoStepOperations} from '../helpers.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-word-problems-two-step',
    compatibility: [generatorLabelRule('two-step-operation-count', [
        Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division
    ], selected => {
        const operations = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division].filter(selected);
        return operations.length >= 1 && operations.length <= 2;
    })],
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
