import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const resolveStrategy = selectCanonicalLabel([
    [[Area.AdditionCompensation], 'addition-compensation'],
    [[Area.SubtractionCompensation], 'subtraction-compensation'],
    [[Area.SubtractionMakeTen], 'subtraction-make-ten'],
    [[Area.SubtractionThinkAddition], 'subtraction-think-addition']
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'integer-add-subtract-strategies',
    generalLabels: [
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const IntegerAddSubtractStrategiesGeneratorSchema = {
    strategy: [[
        Area.AdditionCompensation,
        Area.SubtractionCompensation,
        Area.SubtractionMakeTen,
        Area.SubtractionThinkAddition
    ], resolveStrategy],
    range: [
        deductCompatible([Scope.NumbersSmaller1000]),
        resolveRangeFromLabels
    ]
} as const;

export type IntegerAddSubtractStrategiesGeneratorConfig = ConfigFromSchema<
    typeof IntegerAddSubtractStrategiesGeneratorSchema
>;
