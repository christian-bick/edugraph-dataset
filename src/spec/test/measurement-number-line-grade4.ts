import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const measurementKinds = [
    [Scope.MeterScale],
    [Scope.HourIntervals],
    [Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale],
    [Scope.KilogramScale],
    [Scope.Dollar]
];

const builder = new DatasetPermutationBuilder()
    .addLabels([Scope.Numberline, Ability.VisualArticulation])
    .applyLabelVariants(measurementKinds)
    .applyLabelVariants([
        [Area.NumerationWithFractions, Scope.FractionNumbers],
        [Area.NumerationWithDecimals, Scope.DecimalNumbers]
    ]);

export const spec: CompetencyTarget[] = toTargets('test-grade4-measurement-number-line', builder);
