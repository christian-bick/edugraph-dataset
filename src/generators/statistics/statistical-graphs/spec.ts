import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'statistical-graphs',
    generalLabels: [Area.Statistics, Scope.IntegerNumbers]
};

export const StatisticalGraphsGeneratorSchema = {
    useAddition: [[Area.Addition], hasLabel(Area.Addition)],
    useSubtraction: [[Area.Subtraction], hasLabel(Area.Subtraction)],
    useTwoOperands: [[Scope.TwoOperands], hasLabel(Scope.TwoOperands)]
} as const;

export type StatisticalGraphsGeneratorConfig = ConfigFromSchema<typeof StatisticalGraphsGeneratorSchema>;
