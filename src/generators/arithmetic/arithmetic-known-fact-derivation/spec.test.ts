import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticKnownFactDerivationGenerator} from './generator.ts';
import {spec} from './spec.ts';

const invariants = [
    Scope.ArabicNumerals,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.NumbersWithoutZero
];

const generate = (labels: string[]) => {
    setSeed(labels.join('|'));
    return generateWithLabels(new ArithmeticKnownFactDerivationGenerator(), [
        ...labels,
        ...invariants
    ]);
};

describe('ArithmeticKnownFactDerivationGenerator spec integration', () => {
    it('declares only invariant mathematical capabilities as general labels', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining(invariants));
        expect(spec.generalLabels).not.toContain(Area.MultiplicationKnownFactDerivation);
        expect(spec.generalLabels).not.toContain(Area.DivisionKnownFactDerivation);
        expect(spec.generalLabels).not.toContain(Ability.ProcedureUnderstanding);
    });

    it.each([
        [
            [
                Area.MultiplicationKnownFactDerivation,
                Area.CommutativeLaw,
                Scope.TwoOperands,
                Scope.NumbersSmaller20
            ],
            'commutative'
        ],
        [
            [
                Area.MultiplicationKnownFactDerivation,
                Area.AssociativeLaw,
                Scope.ThreeOperands,
                Scope.NumbersSmaller20
            ],
            'associative'
        ],
        [
            [
                Area.DivisionKnownFactDerivation,
                Area.Equation,
                Scope.TwoOperands,
                Scope.NumbersSmaller100,
                Ability.ProcedureInversion
            ],
            'inverse-division'
        ],
        [
            [
                Area.MultiplicationKnownFactDerivation,
                Area.PlaceValue,
                Scope.TwoOperands,
                Scope.NumbersSmaller1000,
                Scope.MultiplesOf10,
                Scope.SingleDigitSmallestOperand,
                Scope.TwoDigitLargestOperand
            ],
            'place-value-scaling'
        ]
    ] as const)('resolves the authored labels to %s', (labels, expectedStrategy) => {
        const stub = generate([...labels, Ability.ProcedureUnderstanding]);
        expect(stub).not.toBeNull();
        expect(stub!.data.strategy).toBe(expectedStrategy);
    });

    it.each([
        [Area.MultiplicationKnownFactDerivation, 'commutative'],
        [Area.DivisionKnownFactDerivation, 'inverse-division']
    ] as const)('resolves the broad %s fluency target', (area, expectedStrategy) => {
        const stub = generate([
            area,
            Scope.TwoOperands,
            Scope.NumbersSmaller100,
            Ability.ProcedureUnderstanding
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.strategy).toBe(expectedStrategy);
    });
});
