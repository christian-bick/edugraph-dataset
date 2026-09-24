import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-mass-estimation',
    generalLabels: [Area.Estimation, Area.MeasuringWeight]
};

export const MeasurementMassEstimationGeneratorSchema = {
    measurement: [[Scope.GramScale, Scope.KilogramScale], selectExactLabelMap([
        [Scope.GramScale, 'gram-weight'],
        [Scope.KilogramScale, 'kilogram-weight']
    ])]
} as const;
export type MeasurementMassEstimationGeneratorConfig = ConfigFromSchema<typeof MeasurementMassEstimationGeneratorSchema>;
