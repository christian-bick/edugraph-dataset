import {random} from '../../../lib/random.ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MeasurementEstimateProblem} from '../../../types/problems.ts';
import {MeasurementLengthEstimationGeneratorConfig, MeasurementLengthEstimationGeneratorSchema} from './spec.ts';

const estimateVariants = [0, 1, 2] as const;
const referenceVariants = [0, 1, 2, 3] as const;

export class MeasurementLengthEstimationGenerator implements ProblemGenerator<MeasurementEstimateProblem, MeasurementLengthEstimationGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementLengthEstimationGeneratorSchema;
    generate(config: MeasurementLengthEstimationGeneratorConfig): ProblemStub<MeasurementEstimateProblem> {
        validateConfigFields('measurement-length-estimation', config, []);

        return {data: {
            referenceSize: random() < 0.5 ? 'small' : 'large',
            estimateVariant: estimateVariants[Math.floor(random() * estimateVariants.length)],
            referenceVariant: referenceVariants[Math.floor(random() * referenceVariants.length)]
        }};
    }
}
