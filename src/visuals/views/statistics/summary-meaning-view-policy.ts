import {Area, Scope} from 'edugraph-ts';
import type {ViewCompatibilityRule} from '../../../types/compatibility.ts';

const statisticalClaims = [Area.EmpiricalDistributionShape, Area.StatisticalVariability, Area.ArithmeticMean,
    Area.Median, Area.MeanAbsoluteDeviation, Area.InterquartileRange, Area.FrequencyDistribution, Area.Quartile,
    Area.StatisticalSample, Area.NumerationWithIntegers, Area.StatisticalVariable, Area.StatisticalOutlier,
    Scope.QuantityMeasurement] as const;

function originalSummaryTask(id: string, summaries: readonly string[]): ViewCompatibilityRule {
    return {id, description: 'The original task explicitly asks for the meaning of a supported summary.',
        dependencies: summaries.map(label => ({scope: 'target' as const, label})),
        predicate: labels => summaries.some(label => labels.has('target', label))};
}

function singleSummaryEvidence(id: string, summaries: readonly string[]): ViewCompatibilityRule {
    return {id, description: 'One summary meaning is projected; additional statistical theorem bundles are not admitted.',
        dependencies: statisticalClaims.map(label => ({scope: 'generator' as const, label})),
        predicate: labels => summaries.filter(label => labels.has('generator', label)).length === 1
            && statisticalClaims.filter(label => !summaries.includes(label)).every(label => !labels.has('generator', label))};
}

export const centerSummaryOriginalTask = originalSummaryTask('center-summary-original-task', [Area.ArithmeticMean, Area.Median]);
export const variationSummaryOriginalTask = originalSummaryTask('variation-summary-original-task', [Area.MeanAbsoluteDeviation, Area.InterquartileRange]);
export const centerSummaryEvidence = singleSummaryEvidence('center-summary-complete-evidence', [Area.ArithmeticMean, Area.Median]);
export const variationSummaryEvidence = singleSummaryEvidence('variation-summary-complete-evidence', [Area.MeanAbsoluteDeviation, Area.InterquartileRange]);
