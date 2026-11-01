import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementNumberLineGenerator} from './generator.ts';
import {measurementNumberLineNumberKinds, spec} from './spec.ts';
import {MeasurementNumberLineGeneratorSchema as schema} from './spec.ts';
import {measurementLineRangeProfiles} from './numeric-domain.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {spec as viewSpec} from '../../../visuals/views/measurement/measurement-number-line/spec.ts';

const measurementCases = [
    [[Scope.MeterScale], [Scope.MeterScale], 'length'],
    [[Scope.HourIntervals], [Scope.HourIntervals], 'time'],
    [[Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale], [Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale], 'liquid-volume'],
    [[Scope.KilogramScale], [Scope.KilogramScale], 'weight'],
    [[Scope.Dollar], [Scope.Dollar], 'money']
] as const;

const numberCases = [
    [Scope.FractionNumbers, Area.NumerationWithFractions, 'fraction'],
    [Scope.DecimalNumbers, Area.NumerationWithDecimals, 'decimal']
] as const;

describe('MeasurementNumberLineGenerator spec integration', () => {
    const generator = new MeasurementNumberLineGenerator();

    it('resolves every unit/number-kind/canonical-count cell through direct and planned paths', () => {
        const evaluator = createLabelDependencyEvaluator();
        let cells = 0;
        for (const [unitLabels, , measurementKind] of measurementCases) for (const [numberLabel, numerationArea, numberKind] of numberCases) {
            const numberLabels = [numerationArea, numberKind === 'fraction' ? Scope.ProperFractions : numberLabel];
            for (const profile of measurementLineRangeProfiles) {
                const labels = [...unitLabels, ...numberLabels, ...profile.labels];
                const expected = {measurementKind, numberKind, range: profile.range};
                expect(extractConfig(schema, labels).config).toEqual(expected);
                expect(resolveSchemaChoices(schema, labels, {measurementKind: unitLabels, numberKind: numberLabels,
                    range: profile.labels}).config).toEqual(expected);
                const result = evaluator.evaluate([...spec.generalLabels!, ...viewSpec.generalLabels!, ...labels]);
                expect(result.errors).toEqual([]);
                expect(result.conflicts).toEqual([]);
                expect(result.assessments.filter(item => item.status === 'missing')).toEqual([]);
                cells++;
            }
        }
        expect(cells).toBe(20);
    });

    it('keeps numeration in the number-kind schema and units in the measurement schema', () => {
        expect(spec.generalLabels).toEqual([Scope.NumbersWithoutNegatives, Scope.NumbersWithZero]);
        expect(measurementNumberLineNumberKinds).toEqual([
            Scope.ProperFractions,
            Scope.DecimalNumbers
        ]);
    });

    it('resolves the complete corrected 10-target matrix', () => {
        for (const [measurementLabels, resolvedMeasurementLabels, measurementKind] of measurementCases) {
            for (const [numberLabel, numerationArea, numberKind] of numberCases) {
                const labels = [
                    Scope.Numberline,
                    Ability.VisualArticulation,
                    ...measurementLabels,
                    numberLabel,
                    numerationArea
                ];
                setSeed(`${measurementKind}-${numberKind}`);
                const stub = generateWithLabels(generator, labels);
                expect(stub).not.toBeNull();
                expect(stub!.data).toMatchObject({measurementKind, numberKind});
                expect(stub!.labels).toEqual(expect.arrayContaining([
                    ...resolvedMeasurementLabels,
                    numerationArea,
                    numberKind === 'fraction' ? Scope.ProperFractions : numberLabel
                ]));
                if (numberKind === 'fraction') expect(stub!.labels).not.toContain(Scope.FractionNumbers);
                expect(stub!.labels).not.toContain(Area.MeasuringWithUnits);
                expect(stub!.labels).not.toContain(Scope.Numberline);
                expect(stub!.labels).not.toContain(Ability.VisualArticulation);
            }
        }
    });

    it('resolves Dollar as a unit-measurement Scope', () => {
        setSeed('money-decimal-line');
        const stub = generateWithLabels(generator, [
            Scope.Dollar,
            Scope.DecimalNumbers,
            Area.NumerationWithDecimals,
            Scope.Numberline,
            Ability.VisualArticulation
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.measurementKind).toBe('money');
        expect(stub!.labels).toContain(Scope.Dollar);
        expect(stub!.labels).not.toContain(Area.MeasuringWithUnits);
    });
});
