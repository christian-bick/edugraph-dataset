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
        validateConfigFields('measurement-order', config, ['relation']);
        const relation = config.relation;
        if (relation !== Scope.Least && relation !== Scope.Most) return null;

        const lengths = new Set<number>();
        while (lengths.size < 3) {
            lengths.add(60 + Math.floor(random() * 121));
        }
        const objects = Array.from(lengths).map((length, index) => ({
            id: String.fromCharCode(65 + index),
            length
        }));
        const direction = relation === Scope.Least ? 'ascending' : 'descending';
        const order = [...objects]
            .sort((a, b) => direction === 'ascending' ? a.length - b.length : b.length - a.length)
            .map(object => object.id);

        return {
            data: {objects, direction, order}
        };
    }
}
