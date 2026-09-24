import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {
    hasLabel,
    selectExactLabelMap,
    selectExactMatch
} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const resolveOperation = selectExactLabelMap([
    [Area.MultiplicationKnownFactDerivation, 'multiplication'],
    [Area.DivisionKnownFactDerivation, 'division']
] as const);

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-known-fact-derivation',
    compatibility: [generatorLabelRule('known-fact-strategy', [
        Area.MultiplicationKnownFactDerivation, Area.DivisionKnownFactDerivation,
        Area.CommutativeLaw, Area.AssociativeLaw, Area.PlaceValue, Scope.TwoOperands, Scope.ThreeOperands
    ], selected => {
        const commutative = selected(Area.CommutativeLaw);
        const associative = selected(Area.AssociativeLaw);
        const scaling = selected(Area.PlaceValue);
        const multiplication = selected(Area.MultiplicationKnownFactDerivation);
        if (Number(commutative) + Number(associative) + Number(scaling) > 1) return false;
        if ((commutative || scaling) && (!multiplication || !selected(Scope.TwoOperands))) return false;
        if (associative && (!multiplication || !selected(Scope.ThreeOperands))) return false;
        return !selected(Scope.ThreeOperands) || associative;
    })],
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
