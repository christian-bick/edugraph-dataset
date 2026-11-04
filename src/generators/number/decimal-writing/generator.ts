import {Area} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalWritingProblem} from '../../../types/problems.ts';
import {
    DecimalWritingGeneratorSchema,
    type DecimalWritingGeneratorConfig
} from './spec.ts';
import {sampleDecimalWritingInRange} from '../decimal-writing-values.ts';

export class DecimalWritingGenerator implements ProblemGenerator<
    DecimalWritingProblem,
    DecimalWritingGeneratorConfig
> {
    type: AbstractProblem['type'] = 'writing';
    schema = DecimalWritingGeneratorSchema;

    generate(config: DecimalWritingGeneratorConfig): ProblemStub<DecimalWritingProblem> | null {
        validateConfigFields('decimal-writing', config, ['notationFamily', 'range']);
        if (typeof config !== 'object' || Array.isArray(config)
            || Object.keys(config).some(key => !['notationFamily', 'range'].includes(key))) {
            throw new GeneratorValidationError('decimal-writing', 'Only notation and range profiles are accepted.');
        }
        if (config.notationFamily !== Area.DecimalNotation
            && config.notationFamily !== Area.NumberNameNotation) {
            throw new GeneratorValidationError(
                'decimal-writing',
                'Expected DecimalNotation or NumberNameNotation.'
            );
        }

        return {data: sampleDecimalWritingInRange(config.range!)};
    }
}
