import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {CountingSelectionProblem} from '../../../types/problems.ts';
import {countingSupplyRows} from '../canonical-counting-domains.ts';
import {CountingSelectionGeneratorConfig, CountingSelectionGeneratorSchema} from './spec.ts';

export class CountingSelectionGenerator implements ProblemGenerator<CountingSelectionProblem, CountingSelectionGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingSelectionGeneratorSchema;

    generate(config: CountingSelectionGeneratorConfig): ProblemStub<CountingSelectionProblem> | null {
        validateConfigFields('counting-selection', config, ['range', 'parity']);
        const rows = countingSupplyRows(config.range!, config.parity!);
        if (!rows.length) return null;
        let ticket = random() * rows.reduce((sum, row) => sum + row.weight, 0);
        const row = rows.find(row => (ticket -= row.weight) < 0) ?? rows[rows.length - 1]!;
        const availableCount = row.first + Math.floor(random() * (row.last - row.first + 1));
        return {data: {numObjects: row.requested, simpleAnswer: row.requested, availableCount,
            ...(config.parity === 'any' ? {} : {parity: config.parity! as 'even' | 'odd'})}};
    }
}
