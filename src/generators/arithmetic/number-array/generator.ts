import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {NumberArrayProblem} from '../../../types/problems.ts';
import {NumberArrayGeneratorConfig, NumberArrayGeneratorSchema} from './spec.ts';

const randomInteger = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

export class NumberArrayGenerator implements ProblemGenerator<NumberArrayProblem, NumberArrayGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = NumberArrayGeneratorSchema;

    generate(config: NumberArrayGeneratorConfig): ProblemStub<NumberArrayProblem> {
        validateConfigFields('number-array', config, ['requireIteratedOperation']);

        const minimumRows = config.requireIteratedOperation ? 3 : 2;
        const rows = randomInteger(minimumRows, 5);
        const columns = randomInteger(2, 5);
        const total = rows * columns;

        return {
            data: {
                rows,
                columns,
                total,
                addends: Array.from({length: rows}, () => columns)
            }
        };
    }
}
