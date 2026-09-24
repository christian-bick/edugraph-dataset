import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CountingOneOffsetProblem} from '../../../types/problems.ts';
import {CountingIncDecGeneratorConfig, CountingIncDecGeneratorSchema} from './spec.ts';
import {generateCountingOffset} from '../counting-offset.ts';
export class CountingIncDecGenerator implements ProblemGenerator<CountingOneOffsetProblem, CountingIncDecGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingIncDecGeneratorSchema;

    generate(config: CountingIncDecGeneratorConfig): ProblemStub<CountingOneOffsetProblem> | null {
        validateConfigFields('counting-inc-dec', config, ['range', 'direction']);
        return generateCountingOffset(config, 1);
    }
}
