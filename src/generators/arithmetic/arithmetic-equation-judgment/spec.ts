import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec<typeof ArithmeticEquationJudgmentGeneratorSchema> = {
    generatorId: 'arithmetic-equation-judgment',
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

const relations = [
    [[Area.Addition, Scope.NumbersWithoutZero], 'addition-positive'],
    [[Area.Addition, Scope.NumbersWithZero], 'addition-zero'],
    [[Area.Subtraction, Scope.NumbersWithoutZero], 'subtraction-positive'],
    [[Area.Subtraction, Scope.NumbersWithZero], 'subtraction-zero']
] as const;

export const ArithmeticEquationJudgmentGeneratorSchema = {
    relation: [[Area.Addition, Area.Subtraction, Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        selectExactLabelSetMap(relations), relations.map(([labels]) => labels)],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100]),
        resolveRangeFromLabels
    ]
} as const;

export type ArithmeticEquationJudgmentGeneratorConfig = ConfigFromSchema<typeof ArithmeticEquationJudgmentGeneratorSchema>;
