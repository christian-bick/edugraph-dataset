import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {SubtractionCountingBackProblem} from '../../../types/problems.ts';
import {IntegerSubtractionCountingBackGeneratorConfig, IntegerSubtractionCountingBackGeneratorSchema} from './spec.ts';
import {random} from '../../../lib/random.ts';
import {sampleCountingStrategy} from '../canonical-counting-strategy.ts';
export class IntegerSubtractionCountingBackGenerator implements ProblemGenerator<SubtractionCountingBackProblem, IntegerSubtractionCountingBackGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = IntegerSubtractionCountingBackGeneratorSchema;

    generate(config: IntegerSubtractionCountingBackGeneratorConfig): ProblemStub<SubtractionCountingBackProblem> {
        validateConfigFields('integer-subtraction-counting-back', config, ['range']);
        return {data: sampleCountingStrategy(config.range!, 'subtraction', random)};
    }
}
