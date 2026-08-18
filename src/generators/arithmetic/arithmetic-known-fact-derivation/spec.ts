import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {
    hasLabel,
    matchAllExactLabels,
    selectCanonicalLabel,
    selectExactMatch
} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const resolveOperation = selectCanonicalLabel([
    [[Area.MultiplicationKnownFactDerivation], 'multiplication'],
    [[Area.DivisionKnownFactDerivation], 'division']
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-known-fact-derivation',
    generalLabels: [
        Area.Equation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const ArithmeticKnownFactDerivationGeneratorSchema = {
    operation: [
        [Area.MultiplicationKnownFactDerivation, Area.DivisionKnownFactDerivation],
        resolveOperation
    ],
    arity: [
        [Scope.TwoOperands, Scope.ThreeOperands],
        selectExactMatch
    ],
    useCommutativeLaw: [
        [Area.CommutativeLaw],
        hasLabel(Area.CommutativeLaw)
    ],
    useAssociativeLaw: [
        [Area.AssociativeLaw],
        hasLabel(Area.AssociativeLaw)
    ],
    taskAbilities: [
        [Ability.ProcedureUnderstanding, Ability.ProcedureInversion],
        matchAllExactLabels
    ],
    usePlaceValueScaling: [
        [
            Area.PlaceValue,
            Scope.MultiplesOf10,
            Scope.SingleDigitSmallestOperand,
            Scope.TwoDigitLargestOperand
        ],
        hasLabel(Area.PlaceValue)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000]),
        resolveRangeFromLabels
    ]
} as const;

export type ArithmeticKnownFactDerivationGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticKnownFactDerivationGeneratorSchema
>;
