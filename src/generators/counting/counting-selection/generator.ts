import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {CountingSelectionProblem} from '../../../types/problems.ts';
import {sampleCountingQuantity} from '../counting-quantity.ts';
import {CountingSelectionGeneratorConfig, CountingSelectionGeneratorSchema} from './spec.ts';

export class CountingSelectionGenerator implements ProblemGenerator<CountingSelectionProblem, CountingSelectionGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = CountingSelectionGeneratorSchema;

    generate(config: CountingSelectionGeneratorConfig): ProblemStub<CountingSelectionProblem> | null {
        validateConfigFields('counting-selection', config, ['range', 'parity']);
        const range = config.range!;
        if (!Number.isSafeInteger(range.min) || !Number.isSafeInteger(range.max) || range.min > range.max) return null;

        const quantity = sampleCountingQuantity(range, config.parity!, random);
        if (!quantity) return null;
        const minimumAvailable = Math.max(quantity.numObjects, range.min);
        const availableCount = minimumAvailable + Math.floor(random() * (range.max - minimumAvailable + 1));
        return {data: {...quantity, availableCount}};
    }
}
