import {Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {arithmeticOperations, resolveDeclaredOperation} from '../../arithmetic/helpers.ts';

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
    Scope.DecimalNumbers
] as const;

export const spec: GeneratorSpec = {
    generatorId: 'measurement-word-problems',
    generalLabels: [Scope.SingleStep, Scope.TwoOperands]
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
        selectExactLabelMap([
            [Scope.IntegerNumbers, 'integer'],
            [Scope.FractionNumbers, 'fraction'],
            [Scope.DecimalNumbers, 'decimal']
        ])
    ],
    operation: [arithmeticOperations, resolveDeclaredOperation]
} as const;

export type MeasurementWordProblemsGeneratorConfig = ConfigFromSchema<
    typeof MeasurementWordProblemsGeneratorSchema
>;
