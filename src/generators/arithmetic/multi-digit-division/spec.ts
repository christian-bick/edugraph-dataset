import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, ResolverFn} from '../../../types/schema.ts';

const resolveDivisorDigits: ResolverFn<1 | undefined> = labels =>
    labels.includes(Scope.SingleDigitDivisor) ? 1 : undefined;

const resolveDividendDigits: ResolverFn<1 | 2 | 3 | 4 | undefined> = labels => {
    if (labels.includes(Scope.SingleDigitDividend)) return 1;
    if (labels.includes(Scope.TwoDigitDividend)) return 2;
    if (labels.includes(Scope.ThreeDigitDividend)) return 3;
    if (labels.includes(Scope.FourDigitDividend)) return 4;
    return undefined;
};

export const spec: GeneratorSpec = {
    generatorId: 'multi-digit-division',
    generalLabels: [
        Area.Division,
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
