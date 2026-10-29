import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {resolvePartialQuotientZero} from './zero-profile.ts';

const divisorProfiles = [
    [Scope.SingleDigitDivisor, Area.ImperfectDivisibility, Scope.NumbersWithoutZero],
    [Scope.TwoDigitDivisor]
] as const;

const resolveDivisorDigits = selectExactLabelSetMap([
    [divisorProfiles[0], 1],
    [divisorProfiles[1], 2],
    // The two-digit domain also has a zero-free conditional mathematical profile.
    [[Scope.TwoDigitDivisor, Scope.NumbersWithoutZero], 2]
] as const);

const resolveDividendDigits = selectExactLabelMap([
    [Scope.SingleDigitDividend, 1],
    [Scope.TwoDigitDividend, 2],
    [Scope.ThreeDigitDividend, 3],
    [Scope.FourDigitDividend, 4]
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'multi-digit-division',
    generalLabels: [
        Area.DivisionPartialQuotients,
        Area.Modulo,
        Area.Multiplication,
        Area.Subtraction,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ],
    compatibility: [generatorLabelRule('divisor-dividend-width', [
        Scope.TwoDigitDivisor, Scope.SingleDigitDividend
    ], selected => !selected(Scope.TwoDigitDivisor) || !selected(Scope.SingleDigitDividend)),
        generatorLabelRule('partial-quotient-zero-profile', [
            Scope.SingleDigitDivisor, Scope.NumbersWithZero, Scope.NumbersWithoutZero
        ], selected => selected(Scope.NumbersWithZero) !== selected(Scope.NumbersWithoutZero)
            && !(selected(Scope.SingleDigitDivisor) && selected(Scope.NumbersWithZero)))]
};

export const MultiDigitDivisionGeneratorSchema = {
    divisorDigits: [
        [
            Scope.SingleDigitDivisor,
            Scope.TwoDigitDivisor,
            Area.ImperfectDivisibility,
            Scope.NumbersWithoutZero
        ],
        resolveDivisorDigits,
        divisorProfiles
    ],
    dividendDigits: [
        [
            Scope.SingleDigitDividend,
            Scope.TwoDigitDividend,
            Scope.ThreeDigitDividend,
            Scope.FourDigitDividend
        ],
        resolveDividendDigits
    ],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        resolvePartialQuotientZero,
        [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]
    ]
} as const;

export type MultiDigitDivisionGeneratorConfig = ConfigFromSchema<
    typeof MultiDigitDivisionGeneratorSchema
>;
