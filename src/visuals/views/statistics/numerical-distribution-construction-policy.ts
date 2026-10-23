import {Area, Scope} from 'edugraph-ts';
import type {ViewCompatibilityRule} from '../../../types/compatibility.ts';

const displays = [Scope.LinePlot, Scope.Histogram, Scope.BoxPlot] as const;
const mathematicalClaims = [Area.EmpiricalDistributionShape, Area.StatisticalVariability, Area.ArithmeticMean, Area.Median,
    Area.MeanAbsoluteDeviation, Area.InterquartileRange, Area.FrequencyDistribution, Area.Quartile, Area.StatisticalSample,
    Area.NumerationWithIntegers, Scope.QuantityMeasurement, Area.StatisticalVariable, Area.StatisticalOutlier] as const;

/** The fixed task constructs a genuinely requested numerical display. */
export const numericalDisplayTarget: ViewCompatibilityRule = {
    id: 'numerical-display-original-convention',
    dependencies: displays.map(label => ({scope: 'target' as const, label})),
    predicate: labels => displays.some(label => labels.has('target', label))
};

/** Full runtime model acceptance is separate from complete selected-claim publication. */
export const numericalDisplayEvidence: ViewCompatibilityRule = {
    id: 'numerical-display-complete-evidence',
    dependencies: [...displays.map(label => ({scope: 'view' as const, label})),
        ...mathematicalClaims.map(label => ({scope: 'generator' as const, label}))],
    predicate: labels => {
        const selected = displays.filter(label => labels.has('view', label));
        if (selected.length !== 1) return false;
        const expected: readonly string[] = selected[0] === Scope.BoxPlot ? [Area.Quartile, Area.Median] : [Area.FrequencyDistribution];
        return mathematicalClaims.every(label => labels.has('generator', label) === expected.includes(label));
    }
};
