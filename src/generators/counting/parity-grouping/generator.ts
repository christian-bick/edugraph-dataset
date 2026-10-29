import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {ParityGroupingProblem} from '../../../types/problems.ts';
import {sampleCountingQuantity} from '../counting-quantity.ts';
import {ParityGroupingGeneratorSchema, type ParityGroupingGeneratorConfig} from './spec.ts';

export class ParityGroupingGenerator implements ProblemGenerator<ParityGroupingProblem, ParityGroupingGeneratorConfig> {
    type: AbstractProblem['type'] = 'counting';
    schema = ParityGroupingGeneratorSchema;

    generate(config: ParityGroupingGeneratorConfig): ProblemStub<ParityGroupingProblem> | null {
        validateConfigFields('parity-grouping', config, ['range', 'parity']);
        const range = config.range!;
        if (typeof range !== 'object' || range === null || !Number.isSafeInteger(range.min)
            || !Number.isSafeInteger(range.max) || !['any', 'even', 'odd'].includes(config.parity!)) {
            throw new GeneratorValidationError('parity-grouping', 'Expected integer quantity bounds and a supported parity.');
        }
        // The existing parity task has a 1..20 collection domain. Reuse its exact
        // scalar sampler, so each eligible count keeps its former probability.
        const quantity = sampleCountingQuantity({min: Math.max(1, range.min), max: Math.min(20, range.max)},
            config.parity!, random);
        if (!quantity) return null;
        const remainder = quantity.numObjects % 2 as 0 | 1;
        return {data: {kind: 'parity-grouping', numObjects: quantity.numObjects,
            groupSize: Math.floor(quantity.numObjects / 2), remainder,
            parity: remainder === 0 ? 'even' : 'odd'}};
    }
}
