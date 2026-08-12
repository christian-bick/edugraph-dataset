import {Scope} from 'edugraph-ts';
import {random} from '../../../lib/random.ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MeasurementEstimateProblem} from '../../../types/problems.ts';
import {MeasurementLengthEstimationGeneratorConfig, MeasurementLengthEstimationGeneratorSchema} from './spec.ts';

export class MeasurementLengthEstimationGenerator implements ProblemGenerator<MeasurementEstimateProblem, MeasurementLengthEstimationGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementLengthEstimationGeneratorSchema;
    generate(config: MeasurementLengthEstimationGeneratorConfig): ProblemStub<MeasurementEstimateProblem> | null {
        validateConfigFields('measurement-length-estimation', config, ['unit']);
        if (config.unit === Scope.CentimeterScale) {
            const crayon = random() < 0.5;
            return {data: {unit: 'cm', object: crayon ? 'crayon' : 'book', problemLength: crayon ? 8 + Math.floor(random() * 3) : 20 + Math.floor(random() * 11)}};
        }
        if (config.unit === Scope.MeterScale) {
            const desk = random() < 0.5;
            return {data: {unit: 'm', object: desk ? 'desk' : 'door', problemLength: desk ? 1 + Math.floor(random() * 2) : 2 + Math.floor(random() * 2)}};
        }
        return null;
    }
}
