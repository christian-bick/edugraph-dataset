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
            || !Number.isSafeInteger(range.max) || !['even', 'singleton-odd', 'positive-odd'].includes(config.parity!)) {
            throw new GeneratorValidationError('parity-grouping', 'Expected integer quantity bounds and a supported parity.');
        }
        // Preserve the existing scalar draw within each mathematical profile.
        // A feasible singleton still consumes that same one draw.
        const quantity = sampleCountingQuantity({min: Math.max(config.parity === 'positive-odd' ? 3 : 1, range.min),
            max: Math.min(config.parity === 'singleton-odd' ? 1 : 20, range.max)},
            config.parity === 'even' ? 'even' : 'odd', random);
        if (!quantity) return null;
        const remainder = quantity.numObjects % 2 as 0 | 1;
        return {data: {kind: 'parity-grouping', numObjects: quantity.numObjects,
            groupSize: Math.floor(quantity.numObjects / 2), remainder,
            parity: remainder === 0 ? 'even' : 'odd'}};
    }
}
