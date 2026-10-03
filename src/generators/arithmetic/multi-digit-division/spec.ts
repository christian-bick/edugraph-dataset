import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

const divisorProfiles = [
    [Scope.SingleDigitDivisor, Area.ImperfectDivisibility, Scope.NumbersWithoutZero],
    [Scope.TwoDigitDivisor]
] as const;

const resolveDivisorDigits = selectExactLabelSetMap([
    [divisorProfiles[0], 1],
    [divisorProfiles[1], 2]
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
    ], selected => !selected(Scope.TwoDigitDivisor) || !selected(Scope.SingleDigitDividend))]
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
    ]
} as const;

export type MultiDigitDivisionGeneratorConfig = ConfigFromSchema<
    typeof MultiDigitDivisionGeneratorSchema
>;
