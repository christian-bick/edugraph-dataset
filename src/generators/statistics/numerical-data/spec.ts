import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {numericalRelationSets as relations} from '../numerical-data-inputs.ts';

export const spec: GeneratorSpec = {generatorId: 'numerical-data', generalLabels: []};
const choices = [
    [[Area.EmpiricalDistributionShape, Area.StatisticalVariability, Area.ArithmeticMean, Area.MeanAbsoluteDeviation], relations.distributionMean],
    [[Area.EmpiricalDistributionShape, Area.StatisticalVariability, Area.Median, Area.InterquartileRange], relations.distributionMedian],
    [[Area.ArithmeticMean], relations.mean], [[Area.Median], relations.median],
    [[Area.MeanAbsoluteDeviation], relations.mad], [[Area.InterquartileRange], relations.iqr],
    [[Area.FrequencyDistribution], relations.frequency], [[Area.Quartile, Area.Median], relations.quartiles],
    [[Area.StatisticalSample, Area.NumerationWithIntegers, Scope.QuantityMeasurement], relations.sample],
    [[Area.StatisticalVariable], relations.variable],
    [[Area.EmpiricalDistributionShape, Area.StatisticalOutlier], relations.departure],
    [[Area.ArithmeticMean, Area.Median, Area.MeanAbsoluteDeviation, Area.InterquartileRange, Area.EmpiricalDistributionShape], relations.sensitivity]
] as const;
const labels = [Area.EmpiricalDistributionShape, Area.StatisticalVariability, Area.ArithmeticMean, Area.MeanAbsoluteDeviation,
    Area.Median, Area.InterquartileRange, Area.FrequencyDistribution, Area.Quartile, Area.StatisticalSample,
    Area.NumerationWithIntegers, Scope.QuantityMeasurement, Area.StatisticalVariable, Area.StatisticalOutlier] as const;
export const NumericalDataGeneratorSchema = {relations: [labels, selectExactLabelSetMap(choices), choices.map(([set]) => set)]} as const;
export type NumericalDataGeneratorConfig = ConfigFromSchema<typeof NumericalDataGeneratorSchema>;
