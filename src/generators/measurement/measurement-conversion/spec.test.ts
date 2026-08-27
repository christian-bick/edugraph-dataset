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
    [[Scope.ConversionTable], 'conversion-table']
] as const;

describe('MeasurementConversionGenerator spec integration', () => {
    const generator = new MeasurementConversionGenerator();

    it('declares the structural field that every conversion task observably instantiates', () => {
        expect(spec.generalLabels).toEqual([Area.MeasuringWithUnits]);
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
            expect(stub!.labels).toEqual(expect.arrayContaining([...pairLabels]));
            if (task === 'relative-unit-size') {
                expect(stub!.labels).toContain(Area.UnitScaleRelation);
            } else if (task === 'conversion-table') {
                expect(stub!.labels).toContain(Scope.ConversionTable);
            }
            for (const ability of [Ability.ConceptDerivation, Ability.ProcedureExecution]) {
                expect(stub!.labels).not.toContain(ability);
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
        expect(stub!.labels).toEqual(expect.arrayContaining([
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
        ])).toThrow('Schema field "unitPair" cannot complete the requested label combination.');
    });

    it('resolves a broad request through a complete valid unit-pair fallback', () => {
        setSeed('unit-pair-fallback');
        const stub = generateWithLabels(generator, [Ability.ProcedureExecution]);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('convert-larger-to-smaller');
        const resolvedConcreteScales = stub!.labels.filter(label => [
            Scope.KilometerScale,
            Scope.MeterScale,
            Scope.CentimeterScale,
            Scope.KilogramScale,
            Scope.GramScale,
            Scope.PoundScale,
            Scope.OunceScale,
            Scope.LiterScale,
            Scope.MilliliterScale,
            Scope.HourIntervals,
            Scope.MinuteIntervals,
            Scope.SecondIntervals
        ].includes(label as Scope));
        expect(resolvedConcreteScales.length).toBeGreaterThanOrEqual(2);
    });
});
