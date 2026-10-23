import {Area, Scope} from 'edugraph-ts';
import type {ViewCompatibilityRule} from '../../../types/compatibility.ts';

const claims = [Area.EmpiricalDistributionShape, Area.StatisticalVariability, Area.ArithmeticMean, Area.Median,
    Area.MeanAbsoluteDeviation, Area.InterquartileRange, Area.FrequencyDistribution, Area.Quartile,
    Area.StatisticalSample, Area.NumerationWithIntegers, Scope.QuantityMeasurement, Area.StatisticalVariable, Area.StatisticalOutlier] as const;
const dependencies = claims.map(label => ({scope: 'generator' as const, label}));
const sampleClaims: readonly string[] = [Area.StatisticalSample, Area.NumerationWithIntegers, Scope.QuantityMeasurement];

export const observationCountEvidence: ViewCompatibilityRule = {
    id: 'observation-count-complete-evidence',
    description: 'Count every actual observation, preserving the complete sample, integer enumeration and observation-count unit.',
    dependencies,
    predicate: labels => sampleClaims.every(label => labels.has('generator', label))
        && claims.filter(label => !sampleClaims.includes(label)).every(label => !labels.has('generator', label))
};
export const attributeDescriptionEvidence: ViewCompatibilityRule = {
    id: 'attribute-description-complete-evidence',
    description: 'Extract and articulate the actual recorded characteristic, observational unit, method and units.',
    dependencies,
    predicate: labels => labels.has('generator', Area.StatisticalVariable)
        && claims.filter(label => label !== Area.StatisticalVariable).every(label => !labels.has('generator', label))
};
