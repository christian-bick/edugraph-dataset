import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {LiquidVolumeMeasurementProblem} from '../../../types/problems.ts';
import {
    MeasurementLiquidVolumeGeneratorConfig,
    MeasurementLiquidVolumeGeneratorSchema
} from './spec.ts';

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

export class MeasurementLiquidVolumeGenerator implements ProblemGenerator<
    LiquidVolumeMeasurementProblem,
    MeasurementLiquidVolumeGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementLiquidVolumeGeneratorSchema;

    generate(config: MeasurementLiquidVolumeGeneratorConfig): ProblemStub<LiquidVolumeMeasurementProblem> {
        validateConfigFields('measurement-liquid-volume', config, []);
        const capacity = randomInteger(4, 7);
        const value = randomInteger(1, capacity - 1);
        return {
            data: {
                measurementKind: 'liquid-volume',
                object: 'measuring-jug',
                unit: 'L',
                value,
                capacity,
                tickStep: 1
            }
        };
    }
}
