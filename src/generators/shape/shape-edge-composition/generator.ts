import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapeEdgeCompositionProblem} from '../../../types/problems.ts';
import {ShapeEdgeCompositionGeneratorConfig, ShapeEdgeCompositionGeneratorSchema} from './spec.ts';

const edgeCounts = {triangle: 3, square: 4, rectangle: 4, hexagon: 6} as const;

export class ShapeEdgeCompositionGenerator implements ProblemGenerator<ShapeEdgeCompositionProblem, ShapeEdgeCompositionGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeEdgeCompositionGeneratorSchema;

    generate(config: ShapeEdgeCompositionGeneratorConfig): ProblemStub<ShapeEdgeCompositionProblem> {
        validateConfigFields('shape-edge-composition', config, ['shape']);
        const shape = config.shape;
        if (!shape || !Object.hasOwn(edgeCounts, shape)) {
            throw new GeneratorValidationError('shape-edge-composition', 'Expected a supported straight-sided polygon.');
        }
        const count = edgeCounts[shape];
        return {data: {target: shape, sides: count, corners: count}};
    }
}
