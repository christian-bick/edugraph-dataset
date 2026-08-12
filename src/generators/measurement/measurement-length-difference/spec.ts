import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
export const spec: GeneratorSpec = {generatorId:'measurement-length-difference',generalLabels:[Area.Difference,Scope.LengthMeasurement,Scope.DirectRelation]};
export const MeasurementLengthDifferenceGeneratorSchema={} as const;
export type MeasurementLengthDifferenceGeneratorConfig=ConfigFromSchema<typeof MeasurementLengthDifferenceGeneratorSchema>;
