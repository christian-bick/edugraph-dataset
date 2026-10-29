import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementUnitEquivalencesGenerator} from './generator.ts';
import {MeasurementUnitEquivalencesGeneratorSchema, spec} from './spec.ts';

const unitPairCases = [
    [[Area.UnitMagnitudeScaling, Scope.KilometerScale, Scope.MeterScale], 'kilometer-meter'],
    [[Area.UnitMagnitudeScaling, Scope.MeterScale, Scope.CentimeterScale], 'meter-centimeter'],
    [[Area.UnitMagnitudeScaling, Scope.KilogramScale, Scope.GramScale], 'kilogram-gram'],
    [[Area.UnitFactorScaling, Scope.PoundScale, Scope.OunceScale], 'pound-ounce'],
    [[Area.UnitMagnitudeScaling, Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale, Scope.MilliliterScale], 'liter-milliliter'],
    [[Area.UnitFactorScaling, Scope.HourIntervals, Scope.MinuteIntervals], 'hour-minute'],
    [[Area.UnitFactorScaling, Scope.MinuteIntervals, Scope.SecondIntervals], 'minute-second']
] as const;

describe('MeasurementUnitEquivalencesGenerator spec integration', () => {
    const generator = new MeasurementUnitEquivalencesGenerator();

    it('owns integer, positive, nonzero unit relations as ordinary invariants', () => {
        expect(spec.generalLabels).toEqual([
            Area.UnitScaleRelation, Scope.IntegerNumbers,
            Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero
        ]);
        expect(spec.inferredLabels).toBeUndefined();
        expect(Object.keys(MeasurementUnitEquivalencesGeneratorSchema)).toEqual(['unitPair']);
        expect(MeasurementUnitEquivalencesGeneratorSchema.unitPair[0]).not.toContain(Scope.IntegerNumbers);
    });

    it.each(unitPairCases)('preserves the named-unit declaration for %s in every projection', (pairLabels, pairId) => {
        setSeed(pairId);
        const reference = generateWithLabels(generator, [...pairLabels])!;
        for (const projection of [
            [Area.UnitScaleRelation, Ability.ConceptDerivation],
            [Ability.ProcedureExecution],
            [Scope.ConversionTable, Ability.Formalization]
        ]) {
            setSeed(pairId);
            const stub = generateWithLabels(generator, [...pairLabels, ...projection])!;
            expect(stub.data).toEqual(reference.data);
            expect(stub.data.pair.id).toBe(pairId);
            expect(stub.data).not.toHaveProperty('numericExamples');
            expect(new Set(stub.labels)).toEqual(new Set(pairLabels));
        }
    });

    it.each([
        [Area.UnitMagnitudeScaling, Scope.KilometerScale, Scope.CentimeterScale],
        [Scope.HourIntervals, Scope.SecondIntervals]
    ])('rejects incompatible unit combinations %s', (...labels) => {
        expect(() => generateWithLabels(generator, labels)).toThrow('Unsupported exact label combination');
    });

    it('resolves a broad request to a fully labeled named-unit pair', () => {
        setSeed('unit-pair-fallback');
        const stub = generateWithLabels(generator, [Ability.ProcedureExecution])!;
        const expected = unitPairCases.find(([, pairId]) => pairId === stub.data.pair.id)!;
        expect(new Set(stub.labels)).toEqual(new Set(expected[0]));
        expect(stub.data.equivalents).toHaveLength(5);
    });
});
