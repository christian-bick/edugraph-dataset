import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapeExcludedQuadrilateralProblem} from '../../../types/problems.ts';
import {ShapeExcludedQuadrilateralGeneratorConfig, ShapeExcludedQuadrilateralGeneratorSchema} from './spec.ts';

export class ShapeExcludedQuadrilateralGenerator implements ProblemGenerator<ShapeExcludedQuadrilateralProblem, ShapeExcludedQuadrilateralGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeExcludedQuadrilateralGeneratorSchema;

    generate(_config: ShapeExcludedQuadrilateralGeneratorConfig): ProblemStub<ShapeExcludedQuadrilateralProblem> {
        return {data: {
            kind: 'excluded-quadrilateral', target: 'quadrilateral',
            definition: {sideCount: 4, vertexCount: 4, closed: true, boundary: 'straight', equalSides: false, rightAngleCount: 0},
            excludedCategories: ['rhombus', 'rectangle', 'square']
        }};
    }
}
