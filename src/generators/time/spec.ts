import { GeneratorSpec } from '../../types/generator-spec.ts';
import { VisualBlueprint } from '../../types/ml-engine.ts';

export interface TimeGeneratorSpec extends GeneratorSpec {
    visualDistribution: VisualBlueprint[];
}

export const spec: TimeGeneratorSpec = {
    generatorId: 'time',
    supportedLabels: [],
    visualDistribution: [
        { viewId: 'time-analog', visualParams: { reverse: false }, instancesPerProblem: 1 },
        { viewId: 'time-analog', visualParams: { reverse: true }, instancesPerProblem: 1 }
    ]
};
