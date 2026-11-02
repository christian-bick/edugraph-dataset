import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {PercentQuantityProblem} from '../../../types/problems.ts';
import {randomInteger, rational} from '../helpers.ts';
import {percentRangeRows} from './numeric-domain.ts';
import {PercentQuantityRelationsGeneratorSchema, type PercentQuantityRelationsGeneratorConfig} from './spec.ts';

export class PercentQuantityRelationsGenerator implements ProblemGenerator<
    PercentQuantityProblem, PercentQuantityRelationsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PercentQuantityRelationsGeneratorSchema;

    generate(config: PercentQuantityRelationsGeneratorConfig): ProblemStub<PercentQuantityProblem> {
        validateConfigFields('percent-quantity-relations', config, ['range']);
        const rows = percentRangeRows(config.range!);
        let remaining = random() * rows.reduce((sum, row) => sum + row.weight, 0);
        let selected = rows[rows.length - 1]!;
        for (const row of rows) {
            selected = row;
            remaining -= row.weight;
            if (remaining < 0) break;
        }
        const {percent, denominator, first, last} = selected;
        const scaleFactor = rational(percent, 100);
        const whole = rational(randomInteger(first, last), denominator);
        const part = rational(whole.numerator * scaleFactor.numerator,
            whole.denominator * scaleFactor.denominator);

        return {data: {
            kind: 'percent-quantity', percent,
            perHundred: {numerator: percent, denominator: 100},
            scaleFactor, whole, part
        }};
    }
}
