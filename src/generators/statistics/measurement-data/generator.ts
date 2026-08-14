import {Scope} from 'edugraph-ts';
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
        validateConfigFields('measurement-data', config, ['numberKind']);

        if (config.numberKind === Scope.FractionNumbers) {
            const quarterUnits = [
                (2 + Math.floor(random() * 6)) * 4 + 1,
                (2 + Math.floor(random() * 6)) * 4 + 2,
                ...Array.from({length: objects.length - 2}, () => 8 + Math.floor(random() * 25))
            ];
            const observations = objects.map((object, index) => ({
                object,
                length: quarterUnits[index] / 4
            }));
            return {data: {unit: 'in', subdivisions: 4, observations}};
        }
        const observations = objects.map(object => ({
            object,
            length: 2 + Math.floor(random() * 9)
        }));

        return {data: {unit: 'cm', subdivisions: 1, observations}};
    }
}
