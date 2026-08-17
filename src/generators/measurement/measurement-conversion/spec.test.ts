import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementConversionGenerator} from './generator.ts';
import {spec} from './spec.ts';

const unitPairCases = [
    [[Area.UnitMagnitudeScaling, Scope.LengthMeasurement, Scope.KilometerScale, Scope.MeterScale], 'kilometer-meter'],
    [[Area.UnitMagnitudeScaling, Scope.LengthMeasurement, Scope.MeterScale, Scope.CentimeterScale], 'meter-centimeter'],
    [[Area.UnitMagnitudeScaling, Scope.WeightMeasurement, Scope.KilogramScale, Scope.GramScale], 'kilogram-gram'],
    [[Area.UnitFactorScaling, Scope.WeightMeasurement, Scope.PoundScale, Scope.OunceScale], 'pound-ounce'],
    [[Area.UnitMagnitudeScaling, Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale, Scope.MilliliterScale], 'liter-milliliter'],
    [[Area.UnitFactorScaling, Scope.TimeMeasurement, Scope.HourIntervals, Scope.MinuteIntervals], 'hour-minute'],
    [[Area.UnitFactorScaling, Scope.TimeMeasurement, Scope.MinuteIntervals, Scope.SecondIntervals], 'minute-second']
] as const;

const taskCases = [
    [[Area.UnitScaleRelation, Ability.ConceptDerivation], 'relative-unit-size'],
    [[Ability.ProcedureExecution], 'convert-larger-to-smaller'],
    [[Ability.Formalization], 'conversion-table']
] as const;

describe('MeasurementConversionGenerator spec integration', () => {
    const generator = new MeasurementConversionGenerator();

    it('keeps invariant capabilities empty because every mathematical area varies by task or pair', () => {
        expect(spec.generalLabels).toEqual([]);
    });

    it.each(unitPairCases)('resolves all tasks for %s', (pairLabels, pairId) => {
        for (const [taskLabels, task] of taskCases) {
            setSeed(`${pairId}-${task}`);
            const labels = [Area.MeasuringWithUnits, ...pairLabels, ...taskLabels];
            const stub = generateWithLabels(generator, labels);
            expect(stub).not.toBeNull();
            expect(stub!.data.task).toBe(task);
            expect(stub!.data.task).not.toBe('generic-unit-scale');
            if (stub!.data.task === 'generic-unit-scale') throw new Error('Unexpected generic task.');
            expect(stub!.data.pair.id).toBe(pairId);
            expect(stub!.tags).toEqual(expect.arrayContaining([...pairLabels]));
            if (task === 'relative-unit-size') {
                expect(stub!.tags).toContain(Area.UnitScaleRelation);
            } else if (task === 'conversion-table') {
                expect(stub!.tags).toContain(Ability.Formalization);
            }
            for (const ability of [Ability.ConceptDerivation, Ability.ProcedureExecution]) {
                expect(stub!.tags).not.toContain(ability);
            }
        }
    });

    it('resolves the generic legacy relation only without a scaling area or concrete pair', () => {
        setSeed('generic-legacy');
        const stub = generateWithLabels(generator, [
            Area.UnitScaleRelation,
            Scope.LengthMeasurement,
            Ability.ConceptDerivation
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('generic-unit-scale');
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Area.UnitScaleRelation,
            Scope.LengthMeasurement
        ]));
    });

    it('rejects labels that do not name an approved pair', () => {
        expect(() => generateWithLabels(generator, [
            Area.MeasuringWithUnits,
            Area.UnitMagnitudeScaling,
            Scope.LengthMeasurement,
            Scope.KilometerScale,
            Scope.CentimeterScale,
            Ability.ProcedureExecution
        ])).toThrow('Required field "unitPair" is missing.');
    });
});
