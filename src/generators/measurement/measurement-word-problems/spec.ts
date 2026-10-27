import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {measurementWordProblemOperationChoices, resolveMeasurementWordProblemOperation} from './operation-labels.ts';

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
    compatibility: [generatorLabelRule('measurement-multiplication-operand-digits', [
        Area.Multiplication,
        Scope.IntegerNumbers,
        Scope.FractionNumbers,
        Scope.DecimalNumbers,
        Scope.SingleDigitSmallestOperand,
        Scope.SingleDigitLargestOperand
    ], selected => !selected(Area.Multiplication)
        || (selected(Scope.IntegerNumbers) && selected(Scope.SingleDigitSmallestOperand))
        || ((selected(Scope.FractionNumbers) || selected(Scope.DecimalNumbers))
            && selected(Scope.SingleDigitLargestOperand)))]
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
        selectExactLabelSetMap([
            [[Scope.IntegerNumbers], 'integer'],
            [[Scope.FractionNumbers, Scope.ProperFractions], 'fraction'],
            [[Scope.DecimalNumbers], 'decimal']
        ]),
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
    ]
} as const;

export type MeasurementWordProblemsGeneratorConfig = ConfigFromSchema<
    typeof MeasurementWordProblemsGeneratorSchema
>;
