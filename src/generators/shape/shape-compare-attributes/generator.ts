import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapeCompareAttributesProblem} from '../../../types/problems.ts';
import {ShapeCompareAttributesGeneratorConfig, ShapeCompareAttributesGeneratorSchema} from './spec.ts';
import {comparisonTickets} from './numeric-domain.ts';

export class ShapeCompareAttributesGenerator implements ProblemGenerator<ShapeCompareAttributesProblem, ShapeCompareAttributesGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeCompareAttributesGeneratorSchema;

    generate(config: ShapeCompareAttributesGeneratorConfig): ProblemStub<ShapeCompareAttributesProblem> {
        validateConfigFields('shape-compare-attributes', config, ['shape', 'range']);
        const tickets = comparisonTickets(config.shape!, config.range!);
        if (tickets.length === 0) throw new GeneratorValidationError(
            'shape-compare-attributes', 'The shape and range have no unequal comparison.');
        const frame = tickets[Math.floor(random() * tickets.length)]!;
        return {data: {...frame, shapes: [{...frame.shapes[0]}, {...frame.shapes[1]}]}};
    }
}
