import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CountingHundredOffsetProblem} from '../../../types/problems.ts';
import {CountingHundredOffsetGeneratorConfig, CountingHundredOffsetGeneratorSchema} from './spec.ts';
import {buildCountingOffsetProblem} from '../counting-offset.ts';
import {placeValueOffsetStarts} from '../place-value-offset-domain.ts';
import {random} from '../../../lib/random.ts';
export class CountingHundredOffsetGenerator implements ProblemGenerator<CountingHundredOffsetProblem, CountingHundredOffsetGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingHundredOffsetGeneratorSchema;

    generate(config: CountingHundredOffsetGeneratorConfig): ProblemStub<CountingHundredOffsetProblem> | null {
        validateConfigFields('counting-hundred-offset', config, ['range', 'direction', 'operandProfile', 'requireZero']);
        const starts = placeValueOffsetStarts(100, config.range!, config.direction!, config.operandProfile!, config.requireZero!);
        return starts.length ? {data: buildCountingOffsetProblem(starts[Math.floor(random() * starts.length)]!,
            config.direction!, 100, config.range!.max)} : null;
    }
}
