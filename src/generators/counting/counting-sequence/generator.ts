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
        validateConfigFields('counting-sequence', config, ['range', 'countMode']);

        const stepSize = config.countMode === Scope.AdditiveCount
            ? 1
            : config.countMode === Scope.DerivedCount
                ? 10
                : null;
        if (stepSize === null) {
            throw new GeneratorValidationError('counting-sequence', 'Unsupported counting mode.');
        }

        const range = config.range!;
        const min = Math.max(1, range.min);
        const first = stepSize === 10 ? Math.ceil(min / 10) * 10 : min;
        const last = stepSize === 10 ? Math.floor(range.max / 10) * 10 : range.max;
        if (first > last) return null;

        const available = Math.floor((last - first) / stepSize) + 1;
        const length = stepSize === 1 && last < 100
            ? Math.min(6, available)
            : Math.min(10, available);
        if (length < 2) return null;

        const latestStart = last - (length - 1) * stepSize;
        const earliestStart = stepSize === 1 && latestStart >= 2
            ? Math.max(first, 2)
            : first;
        const start = last >= 100
            ? latestStart
            : earliestStart + Math.floor(random() * (Math.floor((latestStart - earliestStart) / stepSize) + 1)) * stepSize;
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
