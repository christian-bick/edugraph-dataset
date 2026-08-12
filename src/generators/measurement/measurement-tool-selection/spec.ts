import {Area, Scope} from 'edugraph-ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-tool-selection',
    generalLabels: [Area.MeasuringObjects]
};

export const MeasurementToolSelectionGeneratorSchema = {
    tool: [[Scope.PhysicalRuler, Scope.Tapemeter], selectExactMatch]
} as const;

export type MeasurementToolSelectionGeneratorConfig = ConfigFromSchema<typeof MeasurementToolSelectionGeneratorSchema>;
