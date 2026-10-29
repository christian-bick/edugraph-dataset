import {Area} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalWritingProblem} from '../../../types/problems.ts';
import {
    DecimalWritingGeneratorSchema,
    type DecimalWritingGeneratorConfig
} from './spec.ts';
import {decimalWritingHasZero} from './zero-profile.ts';
import {sampleDecimalWriting} from '../decimal-writing-values.ts';

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
        if (config.notationFamily === Area.DecimalNotation) {
            if (profile !== 'legacy') throw new GeneratorValidationError('decimal-writing',
                'DecimalNotation requires the unchanged legacy profile.');
            return {data: sampleDecimalWriting()};
        }
        if (profile !== 'with-zero' && profile !== 'without-zero') {
            throw new GeneratorValidationError('decimal-writing', 'NumberNameNotation requires a declared zero profile.');
        }
        // Condition the same raw mathematics after a matching-capable profile is
        // resolved. The accepted payload never supplies or changes its labels.
        for (let attempt = 0; attempt < 256; attempt++) {
            const data = sampleDecimalWriting();
            if (decimalWritingHasZero(data) === (profile === 'with-zero')) return {data};
        }
        return null;
    }
}
