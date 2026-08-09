import {Scope} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MeasurementOrderProblem} from '../../../types/problems.ts';
import {MeasurementOrderGeneratorConfig, MeasurementOrderGeneratorSchema} from './spec.ts';

export class MeasurementOrderGenerator implements ProblemGenerator<MeasurementOrderProblem, MeasurementOrderGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementOrderGeneratorSchema;

    generate(config: MeasurementOrderGeneratorConfig): ProblemStub | null {
        validateConfigFields('measurement-order', config, ['direction']);
        const orderScope = config.direction;
        if (orderScope !== Scope.AscendingOrder && orderScope !== Scope.DescendingOrder) return null;

        const minimumLength = 60;
        const maximumLength = 180;
        const minimumGap = 20;
        const availableOffset = maximumLength - minimumLength - minimumGap * 2;
        const lengths = Array.from({length: 3}, () => Math.floor(random() * (availableOffset + 1)))
            .sort((a, b) => a - b)
            .map((offset, index) => minimumLength + offset + index * minimumGap);

        for (let index = lengths.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(random() * (index + 1));
            [lengths[index], lengths[swapIndex]] = [lengths[swapIndex], lengths[index]];
        }

        const objects = lengths.map((length, index) => ({
            id: String.fromCharCode(65 + index),
            length
        }));
        const direction = orderScope === Scope.AscendingOrder ? 'ascending' : 'descending';
        const order = [...objects]
            .sort((a, b) => direction === 'ascending' ? a.length - b.length : b.length - a.length)
            .map(object => object.id);

        return {
            data: {objects, direction, order}
        };
    }
}
