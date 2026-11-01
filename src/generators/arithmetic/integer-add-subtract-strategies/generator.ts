import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {IntegerFlexibleStrategyProblem} from '../../../types/problems.ts';
import {IntegerAddSubtractStrategiesGeneratorConfig, IntegerAddSubtractStrategiesGeneratorSchema, spec} from './spec.ts';
import {buildFlexibleStrategy, flexibleStrategyRows} from './domain.ts';

export class IntegerAddSubtractStrategiesGenerator implements ProblemGenerator<IntegerFlexibleStrategyProblem, IntegerAddSubtractStrategiesGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = IntegerAddSubtractStrategiesGeneratorSchema;
    readonly spec = spec;

    generate(config: IntegerAddSubtractStrategiesGeneratorConfig): ProblemStub<IntegerFlexibleStrategyProblem> {
        validateConfigFields('integer-add-subtract-strategies', config, ['strategy', 'range']);
        const rows = flexibleStrategyRows(config.strategy!, config.range!);
        if (!rows.length) throw new GeneratorValidationError('integer-add-subtract-strategies', 'The selected profile has no mathematical strategy frames.');
        let position = random() * rows.reduce((sum, row) => sum + row.weight, 0);
        const row = rows.find(candidate => {
            if (position < candidate.weight) return true;
            position -= candidate.weight;
            return false;
        }) ?? rows.at(-1)!;
        const tail = row.minimum + Math.floor(random() * (row.maximum - row.minimum + 1));
        return {data: buildFlexibleStrategy(config.strategy!, row.anchor, tail)};
    }
}
