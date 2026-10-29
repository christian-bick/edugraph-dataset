import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementConversionValuesGenerator} from './generator.ts';
import {MeasurementConversionValuesGeneratorSchema, spec} from './spec.ts';

const unitPairCases = [
    [[Area.UnitMagnitudeScaling, Scope.KilometerScale, Scope.MeterScale], 'kilometer-meter'],
    [[Area.UnitMagnitudeScaling, Scope.MeterScale, Scope.CentimeterScale], 'meter-centimeter'],
    [[Area.UnitMagnitudeScaling, Scope.KilogramScale, Scope.GramScale], 'kilogram-gram'],
    [[Area.UnitFactorScaling, Scope.PoundScale, Scope.OunceScale], 'pound-ounce'],
    [[Area.UnitMagnitudeScaling, Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale, Scope.MilliliterScale], 'liter-milliliter'],
    [[Area.UnitFactorScaling, Scope.HourIntervals, Scope.MinuteIntervals], 'hour-minute'],
    [[Area.UnitFactorScaling, Scope.MinuteIntervals, Scope.SecondIntervals], 'minute-second']
] as const;

describe('MeasurementConversionValuesGenerator spec integration', () => {
    const generator = new MeasurementConversionValuesGenerator();

    it('keeps the number-kind alternatives in the schema with no empty profile or inference', () => {
        expect(spec.generalLabels).toEqual([
            Area.UnitScaleRelation, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero
        ]);
        expect(spec.inferredLabels).toBeUndefined();
        expect(MeasurementConversionValuesGeneratorSchema.numericProfile[2]).toEqual([
            [Scope.IntegerNumbers], [Scope.DecimalNumbers]
        ]);
    });

    it.each(unitPairCases)('resolves both explicit number kinds for %s', (pairLabels, pairId) => {
        for (const [numberLabel, numberKind] of [
            [Scope.IntegerNumbers, 'integer'],
            [Scope.DecimalNumbers, 'decimal']
        ] as const) {
            setSeed(`${pairId}-${numberKind}`);
            const stub = generateWithLabels(generator, [...pairLabels, numberLabel, Ability.ProcedureExecution])!;
            expect(stub.data.pair.id).toBe(pairId);
            expect(stub.data.numericExamples.numberKind).toBe(numberKind);
            expect(stub.data).not.toHaveProperty('equivalents');
            expect(new Set(stub.labels)).toEqual(new Set([...pairLabels, numberLabel]));
        }
    });

    it.each([
        [Area.UnitMagnitudeScaling, Scope.KilometerScale, Scope.CentimeterScale],
        [Scope.HourIntervals, Scope.SecondIntervals]
    ])('rejects incompatible unit combinations %s', (...labels) => {
        expect(() => generateWithLabels(generator, [...labels, Scope.IntegerNumbers]))
            .toThrow('Unsupported exact label combination');
    });

    it('rejects simultaneous integer and decimal profiles', () => {
        expect(() => generateWithLabels(generator, [
            Area.UnitFactorScaling, Scope.PoundScale, Scope.OunceScale,
            Scope.IntegerNumbers, Scope.DecimalNumbers
        ])).toThrow('Unsupported exact label combination');
    });

    it('resolves a broad request to a labeled pair and an explicit number kind', () => {
        setSeed('numeric-pair-fallback');
        const stub = generateWithLabels(generator, [Ability.ProcedureExecution])!;
        const expected = unitPairCases.find(([, pairId]) => pairId === stub.data.pair.id)!;
        const numberLabel = stub.data.numericExamples.numberKind === 'integer'
            ? Scope.IntegerNumbers : Scope.DecimalNumbers;
        expect(new Set(stub.labels)).toEqual(new Set([...expected[0], numberLabel]));
        expect(stub.data).not.toHaveProperty('equivalents');
    });
});
