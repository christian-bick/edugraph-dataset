import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CountingTenOffsetProblem} from '../../../types/problems.ts';
import {CountingTenOffsetGeneratorConfig, CountingTenOffsetGeneratorSchema} from './spec.ts';
import {buildCountingOffsetProblem} from '../counting-offset.ts';
import {placeValueOffsetStarts} from '../place-value-offset-domain.ts';
import {random} from '../../../lib/random.ts';
export class CountingTenOffsetGenerator implements ProblemGenerator<CountingTenOffsetProblem, CountingTenOffsetGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingTenOffsetGeneratorSchema;

    generate(config: CountingTenOffsetGeneratorConfig): ProblemStub<CountingTenOffsetProblem> | null {
        validateConfigFields('counting-ten-offset', config, ['range', 'direction', 'operandProfile', 'requireZero']);
        const starts = placeValueOffsetStarts(10, config.range!, config.direction!, config.operandProfile!, config.requireZero!);
        return starts.length ? {data: buildCountingOffsetProblem(starts[Math.floor(random() * starts.length)]!,
            config.direction!, 10, config.range!.max)} : null;
    }
}
