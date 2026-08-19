import {Area, Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapeClassifyDimProblem} from '../../../types/problems.ts';
import {ShapeClassifyDimGeneratorConfig, ShapeClassifyDimGeneratorSchema} from './spec.ts';

type ShapeDefinition = {
    shape: ShapeClassifyDimProblem['shape'];
    dimension: typeof Scope.TwoDimensional | typeof Scope.ThreeDimensional;
};

const SHAPES: Readonly<Record<string, ShapeDefinition>> = {
    [Area.Circle]: {shape: 'circle', dimension: Scope.TwoDimensional},
    [Area.Square]: {shape: 'square', dimension: Scope.TwoDimensional},
    [Area.Rectangle]: {shape: 'rectangle', dimension: Scope.TwoDimensional},
    [Area.Triangle]: {shape: 'triangle', dimension: Scope.TwoDimensional},
    [Area.Hexagon]: {shape: 'hexagon', dimension: Scope.TwoDimensional},
    [Area.Cube]: {shape: 'cube', dimension: Scope.ThreeDimensional},
    [Area.Cone]: {shape: 'cone', dimension: Scope.ThreeDimensional},
    [Area.Cylinder]: {shape: 'cylinder', dimension: Scope.ThreeDimensional},
    [Area.Sphere]: {shape: 'sphere', dimension: Scope.ThreeDimensional}
};

export class ShapeClassifyDimGenerator implements ProblemGenerator<ShapeClassifyDimProblem, ShapeClassifyDimGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeClassifyDimGeneratorSchema;

    generate(config: ShapeClassifyDimGeneratorConfig): ProblemStub<ShapeClassifyDimProblem> {
        validateConfigFields('shape-classify-dim', config, ['classify', 'dimension']);
        const definition = SHAPES[config.classify!];
        if (definition === undefined) {
            throw new GeneratorValidationError('shape-classify-dim', `Unsupported shape label: ${config.classify}`);
        }
        if (config.dimension !== definition.dimension) {
            throw new GeneratorValidationError(
                'shape-classify-dim',
                `Selected dimension ${config.dimension} does not agree with ${definition.shape}.`
            );
        }

        const shapeType = config.dimension === Scope.TwoDimensional ? '2d' : '3d';
        return {
            data: {
                shapeType,
                shape: definition.shape,
                answer: shapeType
            }
        };
    }
}
