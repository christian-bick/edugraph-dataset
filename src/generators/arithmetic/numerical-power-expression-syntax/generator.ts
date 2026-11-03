import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {NumericalPowerExpressionSyntaxProblem} from '../../../types/problems.ts';
import {buildNumericalPowerExpressionSyntaxProblem} from '../numerical-power-syntax-helpers.ts';
import {sampleSinglePower} from '../numerical-power-expressions/numeric-profiles.ts';
import {NumericalPowerExpressionSyntaxGeneratorSchema, type NumericalPowerExpressionSyntaxGeneratorConfig} from './spec.ts';

const generatorId = 'numerical-power-expression-syntax';

export class NumericalPowerExpressionSyntaxGenerator implements ProblemGenerator<NumericalPowerExpressionSyntaxProblem, NumericalPowerExpressionSyntaxGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = NumericalPowerExpressionSyntaxGeneratorSchema;

    generate(config: NumericalPowerExpressionSyntaxGeneratorConfig): ProblemStub<NumericalPowerExpressionSyntaxProblem> {
        validateConfigFields(generatorId, config, ['exponents', 'numericProfile']);
        if (!['allow-zero', 'positive'].includes(config.exponents!) || ![1, 2, 3, 4].includes(config.numericProfile!)) {
            throw new GeneratorValidationError(generatorId, 'Choose a supported exponent domain and numeric profile.');
        }
        const sample = sampleSinglePower(config.exponents === 'positive', config.numericProfile!);
        if (!sample) throw new GeneratorValidationError(generatorId, 'Choose a feasible literal-power numeric profile.');
        return {data: buildNumericalPowerExpressionSyntaxProblem({id: 'power', kind: 'power', exponent: sample.exponent,
            base: {id: 'power-base', kind: 'number', value: sample.base,
                notation: sample.base.denominator === 1 ? {kind: 'integer', numeral: String(sample.base.numerator)}
                    : {kind: 'fraction', ...sample.base}}})};
    }
}
