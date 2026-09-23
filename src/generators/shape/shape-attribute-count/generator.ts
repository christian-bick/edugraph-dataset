import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapeAttributeCountSpecificationProblem} from '../../../types/problems.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {ShapeAttributeCountGeneratorConfig, ShapeAttributeCountGeneratorSchema} from './spec.ts';

const polygons = [
    {target: 'triangle', count: 3}, {target: 'quadrilateral', count: 4},
    {target: 'pentagon', count: 5}, {target: 'hexagon', count: 6}
] as const;

export class ShapeAttributeCountGenerator implements ProblemGenerator<ShapeAttributeCountSpecificationProblem, ShapeAttributeCountGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeAttributeCountGeneratorSchema;

    generate(config: ShapeAttributeCountGeneratorConfig): ProblemStub<ShapeAttributeCountSpecificationProblem> {
        validateConfigFields('shape-attribute-count', config, ['attribute']);
        if (config.attribute === 'equal-faces') {
            return {data: {kind: 'attribute-count', target: 'cube', sides: 12, corners: 8, attribute: config.attribute, requiredCount: 6}};
        }
        if (config.attribute !== 'vertices' && config.attribute !== 'angles') {
            throw new GeneratorValidationError('shape-attribute-count', 'Expected vertices, angles, or equal faces.');
        }
        const polygon = polygons[Math.floor(random() * polygons.length)]!;
        return {data: {
            kind: 'attribute-count', target: polygon.target, sides: polygon.count, corners: polygon.count,
            attribute: config.attribute, requiredCount: polygon.count
        }};
    }
}
