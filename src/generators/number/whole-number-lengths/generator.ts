import {validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {WholeNumberLengthProblem} from '../../../types/problems.ts';
import {samplePositiveWholeNumber} from '../whole-number-values.ts';
import {WholeNumberLengthsGeneratorSchema, type WholeNumberLengthsGeneratorConfig} from './spec.ts';

export class WholeNumberLengthsGenerator implements ProblemGenerator<WholeNumberLengthProblem, WholeNumberLengthsGeneratorConfig> {
    type: AbstractProblem['type'] = 'writing';
    schema = WholeNumberLengthsGeneratorSchema;

    generate(config: WholeNumberLengthsGeneratorConfig): ProblemStub<WholeNumberLengthProblem> | null {
        validateConfigFields('whole-number-lengths', config, ['range']);
        const range = config.range!;
        if (!Number.isFinite(range.min) || !Number.isFinite(range.max)
            || range.min > 0 || range.max > Number.MAX_SAFE_INTEGER) return null;
        const endpoint = samplePositiveWholeNumber(range);
        if (endpoint === null) return null;
        return {data: {kind: 'whole-number-length', origin: 0, endpoint, unit: 1}};
    }
}
