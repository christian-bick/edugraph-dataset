import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {RectangleAreaProblem} from '../../../types/problems.ts';
import {selectArrayDimensions} from '../shape-square-array-helpers.ts';
import {
    ShapeRectangleAreaGeneratorConfig,
    ShapeRectangleAreaGeneratorSchema
} from './spec.ts';

export class ShapeRectangleAreaGenerator implements ProblemGenerator<
    RectangleAreaProblem,
    ShapeRectangleAreaGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeRectangleAreaGeneratorSchema;

    generate(
        config: ShapeRectangleAreaGeneratorConfig
    ): ProblemStub<RectangleAreaProblem> {
        validateConfigFields('shape-rectangle-area', config, ['equation']);
        if (typeof config.equation !== 'boolean') {
            throw new GeneratorValidationError(
                'shape-rectangle-area',
                'The equation capability flag must be boolean.'
            );
        }

        const [width, length] = selectArrayDimensions(random());
        return {
            data: {
                kind: 'rectangle-area',
                length,
                width,
                area: length * width,
                unitId: 'square-unit'
            }
        };
    }
}
