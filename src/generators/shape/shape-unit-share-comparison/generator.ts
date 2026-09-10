import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapeUnitShareComparisonProblem} from '../../../types/problems.ts';
import {ShapeUnitShareComparisonGeneratorConfig, ShapeUnitShareComparisonGeneratorSchema} from './spec.ts';

export class ShapeUnitShareComparisonGenerator implements ProblemGenerator<ShapeUnitShareComparisonProblem, ShapeUnitShareComparisonGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeUnitShareComparisonGeneratorSchema;

    generate(config: ShapeUnitShareComparisonGeneratorConfig): ProblemStub<ShapeUnitShareComparisonProblem> {
        validateConfigFields('shape-unit-share-comparison', config, ['shape']);
        const {shape} = config;
        if (shape !== 'circle' && shape !== 'rectangle') {
            throw new GeneratorValidationError('shape-unit-share-comparison', 'Expected a circle or rectangle.');
        }
        return {data: {kind: 'share-comparison', shape, leftParts: 4, relation: 'less', rightParts: 2}};
    }
}
