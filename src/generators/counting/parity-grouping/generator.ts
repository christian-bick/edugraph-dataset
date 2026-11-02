import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {ParityGroupingProblem} from '../../../types/problems.ts';
import {groupingCountsForRange} from '../canonical-counting-domains.ts';
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
        const counts = groupingCountsForRange(range, config.parity!);
        if (!counts.length) return null;
        const count = counts[Math.floor(random() * counts.length)]!;
        const remainder = count % 2 as 0 | 1;
        return {data: {kind: 'parity-grouping', numObjects: count,
            groupSize: Math.floor(count / 2), remainder,
            parity: remainder === 0 ? 'even' : 'odd'}};
    }
}
