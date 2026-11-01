import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CountingSequenceProblem} from '../../../types/problems.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {CountingSequenceGeneratorConfig, CountingSequenceGeneratorSchema, sequenceSteps} from './spec.ts';
import {sequenceFramesForRange} from './numeric-domain.ts';

export class CountingSequenceGenerator implements ProblemGenerator<CountingSequenceProblem, CountingSequenceGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingSequenceGeneratorSchema;

    generate(config: CountingSequenceGeneratorConfig): ProblemStub<CountingSequenceProblem> | null {
        validateConfigFields('counting-sequence', config, ['range', 'stepMagnitude', 'requireMultipleOf10']);

        const stepSizes = new Map<string, 1 | 5 | 10 | 100>(sequenceSteps);
        const stepSize = stepSizes.get(config.stepMagnitude!);
        if (stepSize === undefined) {
            throw new GeneratorValidationError('counting-sequence', 'Unsupported step magnitude.');
        }
        if (config.requireMultipleOf10 && stepSize !== 10) return null;
        const frames = sequenceFramesForRange(stepSize, config.requireMultipleOf10!, config.range!);
        return frames.length ? {data: structuredClone(frames[Math.floor(random() * frames.length)]!)} : null;
    }
}
