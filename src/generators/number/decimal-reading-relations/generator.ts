import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalReadingRelationProblem, DecimalWritingProblem} from '../../../types/problems.ts';
import {sampleDecimalWritingInRange} from '../decimal-writing-values.ts';
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
        validateConfigFields('decimal-reading-relations', config, ['range']);
        if (typeof config !== 'object' || Array.isArray(config) || Object.keys(config).some(key => key !== 'range')) {
            throw new GeneratorValidationError('decimal-reading-relations', 'Only a range profile is accepted.');
        }
        const source = sampleDecimalWritingInRange(config.range!);
        return {data: buildDecimalReadingRelation(source)};
    }
}
