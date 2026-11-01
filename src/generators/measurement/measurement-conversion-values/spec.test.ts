import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {MeasurementConversionValuesGenerator} from './generator.ts';
import {MeasurementConversionValuesGeneratorSchema, spec} from './spec.ts';
import {conversionRangeLabels} from './range-profile.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {conversionValueRangeProfiles, conversionValueTuples} from './numeric-domain.ts';

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
            expect(new Set(stub.labels.filter(label => !conversionRangeLabels.includes(label))))
                .toEqual(new Set([...pairLabels, numberLabel]));
            expect(hasCanonicalRangeWitness([1, stub.data.pair.factor,
                ...stub.data.numericExamples.equalities.flatMap(row => [row.largerHundredths / 100, row.smallerHundredths / 100])],
            resolveCanonicalRangeFromLabels(stub.labels)!)).toBe(true);
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
        expect(new Set(stub.labels.filter(label => !conversionRangeLabels.includes(label))))
            .toEqual(new Set([...expected[0], numberLabel]));
        expect(stub.data).not.toHaveProperty('equivalents');
    });

    it('resolves every finite unit/kind/range cell through planned and direct paths', () => {
        let cells = 0;
        for (const [pairLabels, pairId] of unitPairCases) for (const [label, kind] of [
            [Scope.IntegerNumbers, 'integer'], [Scope.DecimalNumbers, 'decimal']
        ] as const) for (const profile of conversionValueRangeProfiles) {
            if (!conversionValueTuples(pairId, kind, profile.range).length) continue;
            const labels = [...pairLabels, label, ...profile.labels];
            const direct = extractConfig(MeasurementConversionValuesGeneratorSchema, labels);
            const planned = resolveSchemaChoices(MeasurementConversionValuesGeneratorSchema, labels, {
                unitPair: pairLabels, numericProfile: [label], range: profile.labels
            });
            expect(direct.config).toEqual(planned.config);
            expect(direct.config.range).toEqual(profile.range);
            cells++;
        }
        expect(cells).toBe(26);
    });
});
