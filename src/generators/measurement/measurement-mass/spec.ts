import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-mass',
    generalLabels: [Area.MeasuringWeight]
};

export const MeasurementMassGeneratorSchema = {
    measurement: [[Scope.GramScale, Scope.KilogramScale], selectExactLabelMap([
        [Scope.GramScale, 'gram-weight'],
        [Scope.KilogramScale, 'kilogram-weight']
    ])]
} as const;
export type MeasurementMassGeneratorConfig = ConfigFromSchema<typeof MeasurementMassGeneratorSchema>;
