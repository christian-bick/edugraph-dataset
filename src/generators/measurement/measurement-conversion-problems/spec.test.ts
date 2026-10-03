import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementConversionProblemsGenerator} from './generator.ts';
import {spec} from './spec.ts';

const pairCases = [
    [[Area.UnitMagnitudeScaling, Scope.KilometerScale, Scope.MeterScale], 'kilometer-meter'],
    [[Area.UnitMagnitudeScaling, Scope.MeterScale, Scope.CentimeterScale], 'meter-centimeter'],
    [[Area.UnitMagnitudeScaling, Scope.KilogramScale, Scope.GramScale], 'kilogram-gram'],
    [[Area.UnitFactorScaling, Scope.PoundScale, Scope.OunceScale], 'pound-ounce'],
    [[Area.UnitMagnitudeScaling, Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale, Scope.MilliliterScale], 'liter-milliliter'],
    [[Area.UnitFactorScaling, Scope.HourIntervals, Scope.MinuteIntervals], 'hour-minute'],
    [[Area.UnitFactorScaling, Scope.MinuteIntervals, Scope.SecondIntervals], 'minute-second']
] as const;

describe('MeasurementConversionProblemsGenerator spec integration', () => {
    const generator = new MeasurementConversionProblemsGenerator();

    it('owns the invariant equation, conversion, addition, and multistep math', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.Equation,
            Area.UnitScaleRelation,
            Area.Addition,
            Scope.MultiStep
        ]));
        expect(spec.generalLabels).not.toContain(Ability.ProcedureExecution);
        expect(spec.generalLabels).not.toContain(Ability.TextualReception);
    });

    it.each(pairCases)('resolves both number kinds for %s', (pairLabels, pairId) => {
        for (const [numberLabel, numberKind] of [
            [Scope.IntegerNumbers, 'integer'],
            [Scope.DecimalNumbers, 'decimal']
        ] as const) {
            setSeed(`${pairId}-${numberKind}`);
            const stub = generateWithLabels(generator, [
                Area.Equation,
                Scope.MultiStep,
                ...pairLabels,
                numberLabel,
                Ability.TextualReception,
                Ability.ProcedureExecution
            ])!;
            expect(stub).not.toBeNull();
            expect(stub.data.kind).toBe('measurement-conversion-story');
            expect(stub.data.pair.id).toBe(pairId);
            expect(stub.data.numberKind).toBe(numberKind);
            expect(new Set(stub.labels)).toEqual(new Set([...pairLabels, numberLabel]));
        }
    });

    it('rejects unsupported pair and number-kind combinations', () => {
        expect(() => generateWithLabels(generator, [
            Area.UnitMagnitudeScaling,
            Scope.KilometerScale,
            Scope.CentimeterScale,
            Scope.IntegerNumbers
        ])).toThrow('Unsupported exact label combination');
        expect(() => generateWithLabels(generator, [
            Area.UnitFactorScaling,
            Scope.PoundScale,
            Scope.OunceScale,
            Scope.IntegerNumbers,
            Scope.DecimalNumbers
        ])).toThrow('Ambiguous exact label mapping');
    });
});
