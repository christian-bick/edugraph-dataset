import {Area} from 'edugraph-ts';
import type {ViewCompatibilityRule} from '../../../types/compatibility.ts';

const statisticalAreas = [Area.EmpiricalDistributionShape, Area.StatisticalVariability, Area.ArithmeticMean, Area.Median,
    Area.MeanAbsoluteDeviation, Area.InterquartileRange, Area.FrequencyDistribution, Area.Quartile,
    Area.StatisticalSample, Area.NumerationWithIntegers, Area.StatisticalVariable, Area.StatisticalOutlier] as const;
const dependencies = statisticalAreas.map(label => ({scope: 'generator' as const, label}));

/** Selected mathematical evidence admission never changes the runtime input family. */
export const distributionDescriptionEvidence: ViewCompatibilityRule = {
    id: 'distribution-description-complete-evidence',
    description: 'Distribution interpretation preserves shape, observed variation and either the mean/MAD or median/IQR summary pair.',
    dependencies,
    predicate: labels => {
        const has = (label: string) => labels.has('generator', label);
        const pair = has(Area.ArithmeticMean) && has(Area.MeanAbsoluteDeviation) && !has(Area.Median) && !has(Area.InterquartileRange)
            || has(Area.Median) && has(Area.InterquartileRange) && !has(Area.ArithmeticMean) && !has(Area.MeanAbsoluteDeviation);
        return has(Area.EmpiricalDistributionShape) && has(Area.StatisticalVariability) && pair
            && [Area.FrequencyDistribution, Area.Quartile, Area.StatisticalSample, Area.NumerationWithIntegers, Area.StatisticalVariable, Area.StatisticalOutlier].every(label => !has(label));
    }
};

export const distributionPatternsEvidence: ViewCompatibilityRule = {
    id: 'distribution-patterns-complete-evidence',
    description: 'Contextual pattern interpretation preserves empirical shape and a criterion-backed departure, without a separate summary calculation or data-construction claim.',
    dependencies,
    predicate: labels => labels.has('generator', Area.EmpiricalDistributionShape) && labels.has('generator', Area.StatisticalOutlier)
        && statisticalAreas.filter(label => label !== Area.EmpiricalDistributionShape && label !== Area.StatisticalOutlier).every(label => !labels.has('generator', label))
};
