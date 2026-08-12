import {Scope} from 'edugraph-ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CountingSequenceProblem} from '../../../types/problems.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {CountingSequenceGeneratorConfig, CountingSequenceGeneratorSchema} from './spec.ts';

export class CountingSequenceGenerator implements ProblemGenerator<CountingSequenceProblem, CountingSequenceGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingSequenceGeneratorSchema;

    generate(config: CountingSequenceGeneratorConfig): ProblemStub<CountingSequenceProblem> | null {
        validateConfigFields('counting-sequence', config, ['range', 'stepMagnitude', 'requireMultipleOf10']);

        const stepSizes = new Map<string, 1 | 5 | 10 | 100>([
            [Scope.StepsOf1, 1],
            [Scope.StepsOf5, 5],
            [Scope.StepsOf10, 10],
            [Scope.StepsOf100, 100]
        ]);
        const stepSize = stepSizes.get(config.stepMagnitude!);
        if (stepSize === undefined) {
            throw new GeneratorValidationError('counting-sequence', 'Unsupported step magnitude.');
        }
        if (config.requireMultipleOf10 && stepSize !== 10) return null;

        const range = config.range!;
        const min = Math.max(1, range.min);
        const first = config.requireMultipleOf10 ? Math.ceil(min / 10) * 10 : min;
        const last = config.requireMultipleOf10 ? Math.floor(range.max / 10) * 10 : range.max;
        const latestStart = last - stepSize;
        if (first > latestStart) return null;

        const startCount = Math.floor((latestStart - first) / stepSize) + 1;
        const start = first + Math.floor(random() * startCount) * stepSize;
        const availableFromStart = Math.floor((last - start) / stepSize) + 1;
        const preferredLength = stepSize === 1 && last < 100 ? 6 : 10;
        const length = Math.min(preferredLength, availableFromStart);

        const sequence = Array.from({length}, (_, index) => start + index * stepSize);
        const missingIndex = 1 + Math.floor(random() * (sequence.length - 1));

        return {
            data: {
                sequence,
                missingIndex,
                answer: sequence[missingIndex],
                stepSize
            }
        };
    }
}
