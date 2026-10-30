import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalReadingRelationProblem, DecimalWritingProblem} from '../../../types/problems.ts';
import {sampleDecimalWritingWithWholeZero} from '../decimal-writing-values.ts';
import {DecimalReadingRelationsGeneratorSchema, type DecimalReadingRelationsGeneratorConfig} from './spec.ts';

/** Exact neighboring values retain the original 1/10/100-thousandth offsets and boundary reflection. */
export function buildDecimalReadingRelation(source: DecimalWritingProblem): DecimalReadingRelationProblem {
    const fraction = source.valueInThousandths - source.wholePart * 1000;
    const comparisonValue = (offset: number) => source.wholePart * 1000
        + (fraction + offset <= 999 ? fraction + offset : fraction - offset);
    return {kind: 'decimal-reading-relation', source,
        comparisonValues: [comparisonValue(1), comparisonValue(10), comparisonValue(100)]};
}

export class DecimalReadingRelationsGenerator implements ProblemGenerator<
    DecimalReadingRelationProblem, DecimalReadingRelationsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'writing';
    schema = DecimalReadingRelationsGeneratorSchema;

    generate(config: DecimalReadingRelationsGeneratorConfig): ProblemStub<DecimalReadingRelationProblem> | null {
        validateConfigFields('decimal-reading-relations', config, ['zeroProfile']);
        if (typeof config !== 'object' || Array.isArray(config) || Object.keys(config).some(key => key !== 'zeroProfile')) {
            throw new GeneratorValidationError('decimal-reading-relations', 'Only a zero profile is accepted.');
        }
        if (config.zeroProfile !== 'with-zero' && config.zeroProfile !== 'without-zero') {
            throw new GeneratorValidationError('decimal-reading-relations', 'A declared zero profile is required.');
        }
        const source = sampleDecimalWritingWithWholeZero(config.zeroProfile === 'with-zero');
        return source ? {data: buildDecimalReadingRelation(source)} : null;
    }
}
