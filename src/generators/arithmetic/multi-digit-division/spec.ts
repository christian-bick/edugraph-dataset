import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {ConfigFromSchema, ResolverFn} from '../../../types/schema.ts';

const resolveDivisorDigits: ResolverFn<1 | undefined> = labels =>
    labels.includes(Scope.SingleDigitDivisor) ? 1 : undefined;

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
        Area.ImperfectDivisibility,
        Area.Multiplication,
        Area.Subtraction,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const MultiDigitDivisionGeneratorSchema = {
    divisorDigits: [
        [Scope.SingleDigitDivisor],
        resolveDivisorDigits
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
