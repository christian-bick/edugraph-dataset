import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CountingHundredOffsetProblem} from '../../../types/problems.ts';
import {CountingHundredOffsetGeneratorConfig, CountingHundredOffsetGeneratorSchema} from './spec.ts';
import {generateCountingOffset} from '../counting-offset.ts';
export class CountingHundredOffsetGenerator implements ProblemGenerator<CountingHundredOffsetProblem, CountingHundredOffsetGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingHundredOffsetGeneratorSchema;

    generate(config: CountingHundredOffsetGeneratorConfig): ProblemStub<CountingHundredOffsetProblem> | null {
        validateConfigFields('counting-hundred-offset', config, ['range', 'direction']);
        return generateCountingOffset(config, 100);
    }
}
