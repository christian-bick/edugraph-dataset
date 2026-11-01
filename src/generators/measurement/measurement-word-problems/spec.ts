import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {
    measurementWordProblemOperandDigitChoices,
    measurementWordProblemOperationChoices,
    resolveMeasurementWordProblemOperation
} from './operation-labels.ts';
import {
    measurementRangeChoices,
    measurementRangeContext,
    measurementRangeLabels,
    permitsMeasurementRange,
    resolveMeasurementNumberKind,
    resolveMeasurementOperandDigits,
    resolveMeasurementRange
} from './range-profile.ts';
import {resolveOptionalCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';

export const measurementWordProblemKinds = [
    Scope.MeterScale,
    Scope.HourIntervals,
    Scope.LiquidVolumes,
    Scope.KilogramScale,
    Scope.Dollar
] as const;

export const measurementWordProblemNumberKinds = [
    Scope.IntegerNumbers,
    Scope.FractionNumbers,
    Scope.ProperFractions,
    Scope.DecimalNumbers
] as const;

export const spec: GeneratorSpec = {
    generatorId: 'measurement-word-problems',
    generalLabels: [
        Scope.SingleStep,
        Scope.TwoOperands,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ],
    compatibility: [generatorLabelRule('measurement-operand-digits', [
        Area.Addition,
        Area.Subtraction,
        Area.Multiplication,
        Area.Division,
        Scope.IntegerNumbers,
        Scope.FractionNumbers,
        Scope.DecimalNumbers,
        Scope.SingleDigitSmallestOperand,
        Scope.SingleDigitLargestOperand,
        Scope.TwoDigitLargestOperand,
        Scope.SingleDigitDivisor
    ], selected => {
        if (selected(Area.Division)) return selected(Scope.SingleDigitDivisor);
        if (selected(Area.Multiplication)) return selected(Scope.IntegerNumbers)
            ? selected(Scope.SingleDigitSmallestOperand)
            : selected(Scope.SingleDigitLargestOperand);
        if ((selected(Area.Addition) || selected(Area.Subtraction)) && selected(Scope.IntegerNumbers)) return (
            selected(Scope.SingleDigitLargestOperand) || selected(Scope.TwoDigitLargestOperand)
        );
        return !selected(Scope.SingleDigitSmallestOperand)
            && !selected(Scope.SingleDigitLargestOperand)
            && !selected(Scope.TwoDigitLargestOperand)
            && !selected(Scope.SingleDigitDivisor);
    }), generatorLabelRule('measurement-canonical-range', [
        ...measurementRangeLabels, ...measurementRangeContext
    ], selected => {
        const labels = [...measurementRangeLabels, ...measurementRangeContext].filter(selected);
        const range = resolveOptionalCanonicalRangeFromLabels(labels);
        return range !== undefined && permitsMeasurementRange(labels, range);
    })]
};

export const MeasurementWordProblemsGeneratorSchema = {
    measurementKind: [
        [
            Scope.VolumeMeasurement,
            Scope.LiquidVolumes,
            Scope.Dollar,
            Scope.MeterScale,
            Scope.HourIntervals,
            Scope.LiterScale,
            Scope.KilogramScale
        ],
        selectExactLabelSetMap([
            [[Scope.MeterScale], 'length'],
            [[Scope.HourIntervals], 'time'],
            [[Scope.LiquidVolumes, Scope.VolumeMeasurement, Scope.LiterScale], 'liquid-volume'],
            [[Scope.KilogramScale], 'weight'],
            [[Scope.Dollar], 'money']
        ]),
        [
            [Scope.MeterScale],
            [Scope.HourIntervals],
            [Scope.LiquidVolumes, Scope.VolumeMeasurement, Scope.LiterScale],
            [Scope.KilogramScale],
            [Scope.Dollar]
        ]
    ],
    numberKind: [
        measurementWordProblemNumberKinds,
        resolveMeasurementNumberKind,
        [
            [Scope.IntegerNumbers],
            [Scope.FractionNumbers, Scope.ProperFractions],
            [Scope.DecimalNumbers]
        ]
    ],
    operation: [
        [...new Set(measurementWordProblemOperationChoices.flat())],
        resolveMeasurementWordProblemOperation,
        measurementWordProblemOperationChoices
    ],
    operandDigits: [
        [...new Set(measurementWordProblemOperandDigitChoices.flat())],
        resolveMeasurementOperandDigits,
        measurementWordProblemOperandDigitChoices
    ],
    range: [
        measurementRangeLabels,
        resolveMeasurementRange,
        measurementRangeChoices
    ]
} as const;

export type MeasurementWordProblemsGeneratorConfig = ConfigFromSchema<
    typeof MeasurementWordProblemsGeneratorSchema
>;
