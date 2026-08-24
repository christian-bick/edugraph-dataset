import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementWordProblemsGenerator} from './generator.ts';
import {spec} from './spec.ts';

const measurementCases = [
    [[Area.MeasuringWithUnits, Scope.LengthMeasurement], [Scope.LengthMeasurement, Scope.MeterScale], 'length'],
    [[Area.MeasuringWithUnits, Scope.TimeMeasurement], [Scope.TimeMeasurement, Scope.HourIntervals], 'time'],
    [[Area.MeasuringWithUnits, Scope.VolumeMeasurement, Scope.LiquidVolumes], [Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale], 'liquid-volume'],
    [[Area.MeasuringWithUnits, Scope.WeightMeasurement], [Scope.WeightMeasurement, Scope.KilogramScale], 'weight'],
    [[Area.MeasuringWithUnits, Scope.Dollar], [Scope.Dollar], 'money']
] as const;

const numberCases = [
    [Scope.IntegerNumbers, 'integer'],
    [Scope.FractionNumbers, 'fraction'],
    [Scope.DecimalNumbers, 'decimal']
] as const;

const operationCases = [
    [Area.Addition, 'addition'],
    [Area.Subtraction, 'subtraction'],
    [Area.Multiplication, 'multiplication'],
    [Area.Division, 'division']
] as const;

describe('MeasurementWordProblemsGenerator spec integration', () => {
    const generator = new MeasurementWordProblemsGenerator();

    it('declares unit measurement, one-step, and two-operand invariants generally', () => {
        expect(spec.generalLabels).toEqual([
            Area.MeasuringWithUnits,
            Scope.SingleStep,
            Scope.TwoOperands
        ]);
    });

    it('resolves all 60 corrected Grade 4 label permutations', () => {
        for (const [measurementLabels, resolvedMeasurementLabels, measurementKind] of measurementCases) {
            for (const [numberLabel, numberKind] of numberCases) {
                for (const [operationLabel, operation] of operationCases) {
                    const labels = [
                        Scope.SingleStep,
                        Scope.TwoOperands,
                        Ability.TextualReception,
                        ...measurementLabels,
                        numberLabel,
                        operationLabel
                    ];
                    setSeed(`${measurementKind}-${numberKind}-${operation}`);
                    const stub = generateWithLabels(generator, labels);
                    expect(stub).not.toBeNull();
                    expect(stub!.data).toMatchObject({measurementKind, numberKind, operation});
                    expect(stub!.labels).toEqual(expect.arrayContaining([
                        ...resolvedMeasurementLabels,
                        numberLabel,
                        operationLabel
                    ]));
                    expect(stub!.labels).not.toContain(Area.MeasuringWithUnits);
                    expect(stub!.labels).not.toContain(Ability.TextualReception);
                }
            }
        }
    });

    it('resolves Dollar as a unit-measurement Scope', () => {
        setSeed('money-only');
        const stub = generateWithLabels(generator, [
            Area.MeasuringWithUnits,
            Scope.SingleStep,
            Scope.TwoOperands,
            Scope.Dollar,
            Scope.FractionNumbers,
            Area.Division,
            Ability.TextualReception
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.measurementKind).toBe('money');
        expect(stub!.labels).toContain(Scope.Dollar);
        expect(stub!.labels).not.toContain(Area.MeasuringWithUnits);
    });
});
