import {GeneratorSpec} from '../../types/generator-spec.ts';
import {VisualBlueprint} from '../../types/ml-engine.ts';
import {Area, Scope} from 'edugraph-ts';

export interface OrderingGeneratorSpec extends GeneratorSpec {
    visualDistribution: VisualBlueprint[];
}

export const spec: OrderingGeneratorSpec = {
    generatorId: 'ordering',
    supportedLabels: [
        Area.NumerationWithIntegers,
        Scope.Base10,
        Scope.NumericRange,
        Scope.NumericZero
    ],
    visualDistribution: [
        { viewId: 'numbers-order', constraints: { desc: false }, instancesPerProblem: 1 },
        { viewId: 'numbers-order', constraints: { desc: true }, instancesPerProblem: 1 }
    ]
};
