import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {arithmeticOperations, resolveDeclaredOperation} from '../helpers.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {estimationZeroContext, estimationZeroLabels, permitsEstimationZero, resolveEstimationZero} from './zero-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-estimation',
    compatibility: [generatorLabelRule('estimation-zero-profile', [...estimationZeroContext, ...estimationZeroLabels], selected => {
        const zero = selected(Scope.NumbersWithZero);
        return zero !== selected(Scope.NumbersWithoutZero) && permitsEstimationZero(selected, zero);
    })],
    generalLabels: [
        Area.IntegerRounding,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const ArithmeticEstimationGeneratorSchema = {
    operation: [arithmeticOperations, resolveDeclaredOperation],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000]),
        resolveRangeFromLabels
    ],
    zeroPresence: [
        estimationZeroLabels,
        resolveEstimationZero,
        estimationZeroLabels.map(label => [label])
    ]
} as const;

export type ArithmeticEstimationGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticEstimationGeneratorSchema
>;
