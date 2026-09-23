import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapePolygonDefinitionProblem} from '../../../types/problems.ts';
import {ShapeBuildShapeGeneratorConfig, ShapeBuildShapeGeneratorSchema} from './spec.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {getShapeDefinition} from '../helpers.ts';

export class ShapeBuildShapeGenerator implements ProblemGenerator<ShapePolygonDefinitionProblem, ShapeBuildShapeGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeBuildShapeGeneratorSchema;

    generate(config: ShapeBuildShapeGeneratorConfig): ProblemStub<ShapePolygonDefinitionProblem> {
        validateConfigFields('shape-build-shape', config, ['shape']);
        if (!['triangle', 'square', 'rectangle', 'quadrilateral', 'pentagon', 'hexagon'].includes(config.shape!)) {
            throw new GeneratorValidationError('shape-build-shape', 'Expected a supported polygon.');
        }
        return {data: {kind: 'polygon-definition', target: config.shape!, definition: getShapeDefinition(config.shape!)}};
    }
}
