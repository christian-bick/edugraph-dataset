import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {NumericalExpressionProblem} from '../../../types/problems.ts';
import {numericalExpressionCalculationProblem, numericalExpressionRows, sampleNumericalExpressionFrame} from '../numerical-expression-domain.ts';
import {ArithmeticNumericalExpressionCalculationsGeneratorConfig, ArithmeticNumericalExpressionCalculationsGeneratorSchema} from './spec.ts';

export class ArithmeticNumericalExpressionCalculationsGenerator implements ProblemGenerator<
    NumericalExpressionProblem,
    ArithmeticNumericalExpressionCalculationsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticNumericalExpressionCalculationsGeneratorSchema;

    generate(config: ArithmeticNumericalExpressionCalculationsGeneratorConfig): ProblemStub<NumericalExpressionProblem> | null {
        validateConfigFields('arithmetic-numerical-expression-calculations', config, ['profile']);
        const frame = sampleNumericalExpressionFrame(numericalExpressionRows('calculation', config.profile!), random);
        return frame ? {data: numericalExpressionCalculationProblem(frame)} : null;
    }
}
