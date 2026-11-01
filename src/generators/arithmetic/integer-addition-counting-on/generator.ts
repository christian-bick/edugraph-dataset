import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {AdditionCountingOnProblem} from '../../../types/problems.ts';
import {IntegerAdditionCountingOnGeneratorConfig, IntegerAdditionCountingOnGeneratorSchema} from './spec.ts';
import {random} from '../../../lib/random.ts';
import {sampleCountingStrategy} from '../canonical-counting-strategy.ts';
export class IntegerAdditionCountingOnGenerator implements ProblemGenerator<AdditionCountingOnProblem, IntegerAdditionCountingOnGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = IntegerAdditionCountingOnGeneratorSchema;

    generate(config: IntegerAdditionCountingOnGeneratorConfig): ProblemStub<AdditionCountingOnProblem> {
        validateConfigFields('integer-addition-counting-on', config, ['range']);
        return {data: sampleCountingStrategy(config.range!, 'addition', random)};
    }
}
