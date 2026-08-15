import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {AreaPerimeterRelationProblem, RectangleMeasures} from '../../../types/problems.ts';
import {
    AreaPerimeterRelationsGeneratorConfig,
    AreaPerimeterRelationsGeneratorSchema
} from './spec.ts';

const SAME_PERIMETER_DIMENSIONS = [
    [[2, 6], [3, 5]],
    [[2, 7], [4, 5]],
    [[3, 7], [4, 6]],
    [[2, 8], [4, 6]],
    [[3, 8], [5, 6]]
] as const;

function rectangle(width: number, height: number): RectangleMeasures {
    return {
        width,
        height,
        area: width * height,
        perimeter: 2 * (width + height)
    };
}

export class AreaPerimeterRelationsGenerator implements ProblemGenerator<
    AreaPerimeterRelationProblem,
    AreaPerimeterRelationsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = AreaPerimeterRelationsGeneratorSchema;

    generate(
        _config: AreaPerimeterRelationsGeneratorConfig
    ): ProblemStub<AreaPerimeterRelationProblem> {
        const [[firstWidth, firstHeight], [secondWidth, secondHeight]] =
            SAME_PERIMETER_DIMENSIONS[Math.floor(random() * SAME_PERIMETER_DIMENSIONS.length)];
        return {
            data: {
                task: 'same-perimeter',
                equalMeasure: 'perimeter',
                first: rectangle(firstWidth, firstHeight),
                second: rectangle(secondWidth, secondHeight),
                unit: 'units',
                areaUnit: 'square units'
            }
        };
    }
}
