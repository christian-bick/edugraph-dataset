import {Area, Scope} from 'edugraph-ts';
import type {ViewCompatibilityRule} from '../../../types/compatibility.ts';

export const summarySelectionClaims = [Area.ArithmeticMean, Area.Median, Area.MeanAbsoluteDeviation,
    Area.InterquartileRange, Area.EmpiricalDistributionShape] as const;
const numericalClaims = [...summarySelectionClaims, Area.StatisticalVariability, Area.FrequencyDistribution, Area.Quartile,
    Area.StatisticalSample, Area.NumerationWithIntegers, Area.StatisticalVariable, Area.StatisticalOutlier, Scope.QuantityMeasurement] as const;

/** Publication requires the whole genuine comparison bundle; runtime accepts the full model. */
export const summarySelectionEvidence: ViewCompatibilityRule = {
    id: 'summary-selection-complete-comparison-evidence',
    dependencies: numericalClaims.map(label => ({scope: 'generator' as const, label})),
    predicate: labels => numericalClaims.every(label => labels.has('generator', label) === (summarySelectionClaims as readonly string[]).includes(label))
};
