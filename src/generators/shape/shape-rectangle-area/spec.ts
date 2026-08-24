import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-rectangle-area',
    generalLabels: [
        Area.AreaCalculation,
        Area.Rectangle,
        Area.Multiplication,
        Scope.IntegerNumbers,
        Scope.TwoOperands
    ]
};

export const ShapeRectangleAreaGeneratorSchema = {
    equation: [[Area.Equation], hasLabel(Area.Equation)]
} as const;

export type ShapeRectangleAreaGeneratorConfig = ConfigFromSchema<
    typeof ShapeRectangleAreaGeneratorSchema
>;
