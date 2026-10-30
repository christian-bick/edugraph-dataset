import {Area} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalWritingProblem} from '../../../types/problems.ts';
import {
    DecimalWritingGeneratorSchema,
    type DecimalWritingGeneratorConfig
} from './spec.ts';
import {sampleDecimalWritingWithWholeZero} from '../decimal-writing-values.ts';

export class DecimalWritingGenerator implements ProblemGenerator<
    DecimalWritingProblem,
    DecimalWritingGeneratorConfig
> {
    type: AbstractProblem['type'] = 'writing';
    schema = DecimalWritingGeneratorSchema;

    generate(config: DecimalWritingGeneratorConfig): ProblemStub<DecimalWritingProblem> | null {
        validateConfigFields('decimal-writing', config, ['notationFamily', 'zeroProfile']);
        if (config.notationFamily !== Area.DecimalNotation
            && config.notationFamily !== Area.NumberNameNotation) {
            throw new GeneratorValidationError(
                'decimal-writing',
                'Expected DecimalNotation or NumberNameNotation.'
            );
        }

        const profile = config.zeroProfile;
        if (profile !== 'with-zero' && profile !== 'without-zero') {
            throw new GeneratorValidationError('decimal-writing', 'A declared zero profile is required.');
        }
        // Condition the same raw mathematics after a matching-capable profile is
        // resolved. The accepted payload never supplies or changes its labels.
        const data = sampleDecimalWritingWithWholeZero(profile === 'with-zero');
        return data ? {data} : null;
    }
}
