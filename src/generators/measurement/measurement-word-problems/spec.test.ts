import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementWordProblemsGenerator} from './generator.ts';
import {spec} from './spec.ts';

const measurementCases = [
    [[Area.MeasuringWithUnits, Scope.LengthMeasurement], 'length'],
    [[Area.MeasuringWithUnits, Scope.TimeMeasurement], 'time'],
    [[Area.MeasuringWithUnits, Scope.VolumeMeasurement, Scope.LiquidVolumes], 'liquid-volume'],
    [[Area.MeasuringWithUnits, Scope.WeightMeasurement], 'weight'],
    [[Scope.Dollar], 'money']
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

    it('declares only the invariant one-step, two-operand contract generally', () => {
        expect(spec.generalLabels).toEqual([Scope.SingleStep, Scope.TwoOperands]);
    });

    it('resolves all 60 corrected Grade 4 label permutations', () => {
        for (const [measurementLabels, measurementKind] of measurementCases) {
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
                    expect(stub!.tags).toEqual(expect.arrayContaining([
                        ...measurementLabels,
                        numberLabel,
                        operationLabel
                    ]));
                    expect(stub!.tags).not.toContain(Ability.TextualReception);
                }
            }
        }
    });

    it('does not require physical measurement semantics for money', () => {
        setSeed('money-only');
        const stub = generateWithLabels(generator, [
            Scope.SingleStep,
            Scope.TwoOperands,
            Scope.Dollar,
            Scope.FractionNumbers,
            Area.Division,
            Ability.TextualReception
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.measurementKind).toBe('money');
        expect(stub!.tags).not.toContain(Area.MeasuringWithUnits);
    });

    it('keeps the physical-measurement guard separate from the mathematical kind resolver', () => {
        expect(generator.schema).toHaveProperty('physicalMeasurement');
    });
});
