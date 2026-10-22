import {validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {RatioTableProblem} from '../../../types/problems.ts';
import {pick, randomInteger, ratioQuantities, ratioTable, validateMagnitudeRange} from '../helpers.ts';
import {RatioTablesGeneratorSchema, type RatioTablesGeneratorConfig} from './spec.ts';

export class RatioTablesGenerator implements ProblemGenerator<RatioTableProblem, RatioTablesGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = RatioTablesGeneratorSchema;

    generate(config: RatioTablesGeneratorConfig): ProblemStub<RatioTableProblem> {
        validateConfigFields('ratio-tables', config, ['range']);
        const maximum = Math.floor(validateMagnitudeRange('ratio-tables', config.range!) / 4);
        return {data: ratioTable(
            [randomInteger(1, maximum), randomInteger(1, maximum)],
            pick(ratioQuantities), [1, 2, 3, 4]
        )};
    }
}
