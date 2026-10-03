import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-line-plot-problems',
    generalLabels: [Area.Statistics, Scope.SingleFrameOfReference]
};

export const MeasurementLinePlotProblemsGeneratorSchema = {
    denominator: [[Scope.HalfFractions, Scope.QuarterFractions, Scope.EighthFractions], selectExactLabelMap([
        [Scope.HalfFractions, 2],
        [Scope.QuarterFractions, 4],
        [Scope.EighthFractions, 8]
    ] as const)],
    operation: [[Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division], selectExactLabelMap([
        [Area.Addition, 'addition'],
        [Area.Subtraction, 'subtraction'],
        [Area.Multiplication, 'multiplication'],
        [Area.Division, 'division']
    ] as const)]
} as const;
export type MeasurementLinePlotProblemsGeneratorConfig = ConfigFromSchema<typeof MeasurementLinePlotProblemsGeneratorSchema>;
