import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {RatioTableProblem} from '../../../types/problems.ts';
import {pick, ratioQuantities, ratioTable} from '../helpers.ts';
import {RatioTablesGeneratorSchema, type RatioTablesGeneratorConfig} from './spec.ts';
import {ratioTableBaseRows} from './numeric-domain.ts';

export class RatioTablesGenerator implements ProblemGenerator<RatioTableProblem, RatioTablesGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = RatioTablesGeneratorSchema;

    generate(config: RatioTablesGeneratorConfig): ProblemStub<RatioTableProblem> {
        validateConfigFields('ratio-tables', config, ['range']);
        const rows = ratioTableBaseRows(config.range!);
        if (!rows.length) throw new GeneratorValidationError('ratio-tables', 'Expected a supported canonical table range.');
        let ticket = random() * rows.reduce((sum, row) => sum + row.weight, 0);
        const row = rows.find(row => (ticket -= row.weight) < 0) ?? rows[rows.length - 1]!;
        const second = row.seconds[Math.floor(random() * row.seconds.length)]!;
        return {data: ratioTable(
            [row.first, second],
            pick(ratioQuantities), [1, 2, 3, 4]
        )};
    }
}
