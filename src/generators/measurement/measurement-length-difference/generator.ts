import {random} from '../../../lib/random.ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MeasurementLengthDifferenceProblem} from '../../../types/problems.ts';
import {
    MeasurementLengthDifferenceGeneratorConfig,
    MeasurementLengthDifferenceGeneratorSchema
} from './spec.ts';
import {lengthDifferenceTuples} from './numeric-domain.ts';

export class MeasurementLengthDifferenceGenerator implements ProblemGenerator<
    MeasurementLengthDifferenceProblem,
    MeasurementLengthDifferenceGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementLengthDifferenceGeneratorSchema;

    generate(config: MeasurementLengthDifferenceGeneratorConfig): ProblemStub<MeasurementLengthDifferenceProblem> {
        validateConfigFields('measurement-length-difference', config, ['range']);
        const tuples = lengthDifferenceTuples(config.range!);
        const [shorterLength, difference] = tuples[Math.floor(random() * tuples.length)]!;
        return {
            data: {
                longerLength: shorterLength + difference,
                shorterLength,
                difference,
                unitId: 'centimeter'
            }
        };
    }
}
