import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementNumberLineGenerator} from './generator.ts';
import {measurementNumberLineNumberKinds, spec} from './spec.ts';

const measurementCases = [
    [[Area.MeasuringWithUnits, Scope.LengthMeasurement], 'length'],
    [[Area.MeasuringWithUnits, Scope.TimeMeasurement], 'time'],
    [[Area.MeasuringWithUnits, Scope.VolumeMeasurement, Scope.LiquidVolumes], 'liquid-volume'],
    [[Area.MeasuringWithUnits, Scope.WeightMeasurement], 'weight'],
    [[Scope.Dollar], 'money']
] as const;

const numberCases = [
    [Scope.FractionNumbers, 'fraction'],
    [Scope.DecimalNumbers, 'decimal']
] as const;

describe('MeasurementNumberLineGenerator spec integration', () => {
    const generator = new MeasurementNumberLineGenerator();

    it('has no invariant generator labels because kind and number form both vary', () => {
        expect(spec.generalLabels).toEqual([]);
        expect(measurementNumberLineNumberKinds).toEqual([
            Scope.ProperFractions,
            Scope.DecimalNumbers
        ]);
    });

    it('resolves the complete corrected 10-target matrix', () => {
        for (const [measurementLabels, measurementKind] of measurementCases) {
            for (const [numberLabel, numberKind] of numberCases) {
                const labels = [
                    Scope.Numberline,
                    Ability.VisualArticulation,
                    ...measurementLabels,
                    numberLabel
                ];
                setSeed(`${measurementKind}-${numberKind}`);
                const stub = generateWithLabels(generator, labels);
                expect(stub).not.toBeNull();
                expect(stub!.data).toMatchObject({measurementKind, numberKind});
                expect(stub!.tags).toEqual(expect.arrayContaining([
                    ...measurementLabels,
                    numberLabel
                ]));
                expect(stub!.tags).not.toContain(Scope.Numberline);
                expect(stub!.tags).not.toContain(Ability.VisualArticulation);
            }
        }
    });

    it('resolves Dollar without false physical measurement semantics', () => {
        setSeed('money-decimal-line');
        const stub = generateWithLabels(generator, [
            Scope.Dollar,
            Scope.DecimalNumbers,
            Scope.Numberline,
            Ability.VisualArticulation
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.measurementKind).toBe('money');
        expect(stub!.tags).not.toContain(Area.MeasuringWithUnits);
    });
});
