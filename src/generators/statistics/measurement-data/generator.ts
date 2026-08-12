import {random} from '../../../lib/random.ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MeasurementDataProblem, MeasurementObservation} from '../../../types/problems.ts';
import {MeasurementDataGeneratorConfig, MeasurementDataGeneratorSchema} from './spec.ts';

const objects: MeasurementObservation['object'][] = ['pencil', 'crayon', 'ribbon', 'key', 'brush', 'block'];

export class MeasurementDataGenerator implements ProblemGenerator<MeasurementDataProblem, MeasurementDataGeneratorConfig> {
    type: AbstractProblem['type'] = 'statistics';
    schema = MeasurementDataGeneratorSchema;

    generate(config: MeasurementDataGeneratorConfig): ProblemStub<MeasurementDataProblem> {
        validateConfigFields('measurement-data', config, []);

        const observations = objects.map(object => ({
            object,
            length: 2 + Math.floor(random() * 9)
        }));

        return {data: {unit: 'cm', observations}};
    }
}
