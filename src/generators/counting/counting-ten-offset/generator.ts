import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CountingTenOffsetProblem} from '../../../types/problems.ts';
import {CountingTenOffsetGeneratorConfig, CountingTenOffsetGeneratorSchema} from './spec.ts';
import {generateCountingOffset} from '../counting-offset.ts';
export class CountingTenOffsetGenerator implements ProblemGenerator<CountingTenOffsetProblem, CountingTenOffsetGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingTenOffsetGeneratorSchema;

    generate(config: CountingTenOffsetGeneratorConfig): ProblemStub<CountingTenOffsetProblem> | null {
        validateConfigFields('counting-ten-offset', config, ['range', 'direction']);
        return generateCountingOffset(config, 10);
    }
}
