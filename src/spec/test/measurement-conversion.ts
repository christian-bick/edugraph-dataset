import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const unitPairs = [
    [Area.UnitMagnitudeScaling, Scope.LengthMeasurement, Scope.KilometerScale, Scope.MeterScale],
    [Area.UnitMagnitudeScaling, Scope.LengthMeasurement, Scope.MeterScale, Scope.CentimeterScale],
    [Area.UnitMagnitudeScaling, Scope.WeightMeasurement, Scope.KilogramScale, Scope.GramScale],
    [Area.UnitFactorScaling, Scope.WeightMeasurement, Scope.PoundScale, Scope.OunceScale],
    [Area.UnitMagnitudeScaling, Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale, Scope.MilliliterScale],
    [Area.UnitFactorScaling, Scope.TimeMeasurement, Scope.HourIntervals, Scope.MinuteIntervals],
    [Area.UnitFactorScaling, Scope.TimeMeasurement, Scope.MinuteIntervals, Scope.SecondIntervals]
];

const relativeUnitSizesBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.MeasuringWithUnits, Area.UnitScaleRelation, Ability.ConceptDerivation])
    .applyLabelVariants(unitPairs);

const largerToSmallerBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.MeasuringWithUnits, Ability.ProcedureExecution])
    .applyLabelVariants(unitPairs);

const conversionTableBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.MeasuringWithUnits, Scope.ConversionTable, Ability.Formalization])
    .applyLabelVariants(unitPairs);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-relative-unit-sizes', relativeUnitSizesBuilder),
    ...toTargets('test-convert-larger-to-smaller', largerToSmallerBuilder),
    ...toTargets('test-two-column-conversion-table', conversionTableBuilder)
];
