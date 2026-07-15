import { GeneratorSpec } from '../../types/generator-spec.ts';
import { VisualBlueprint } from '../../types/ml-engine.ts';

export interface OrderingGeneratorSpec extends GeneratorSpec {
    visualDistribution: VisualBlueprint[];
}

export const spec: OrderingGeneratorSpec = {
    generatorId: 'ordering',
    supportedLabels: [],
    visualDistribution: [
        { viewId: 'numbers-order', visualParams: { desc: false }, instancesPerProblem: 1 },
        { viewId: 'numbers-order', visualParams: { desc: true }, instancesPerProblem: 1 }
    ]
};
