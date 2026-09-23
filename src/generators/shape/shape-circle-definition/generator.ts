import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapeCircleDefinitionProblem} from '../../../types/problems.ts';
import {ShapeCircleDefinitionGeneratorConfig, ShapeCircleDefinitionGeneratorSchema} from './spec.ts';
import {getShapeDefinition} from '../helpers.ts';

export class ShapeCircleDefinitionGenerator implements ProblemGenerator<ShapeCircleDefinitionProblem, ShapeCircleDefinitionGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeCircleDefinitionGeneratorSchema;

    generate(_config: ShapeCircleDefinitionGeneratorConfig): ProblemStub<ShapeCircleDefinitionProblem> {
        return {data: {kind: 'circle-definition', target: 'circle', definition: getShapeDefinition('circle')}};
    }
}
