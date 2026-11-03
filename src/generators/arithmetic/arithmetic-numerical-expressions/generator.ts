import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {NumericalExpressionStructureProblem} from '../../../types/problems.ts';
import {numericalExpressionRows, numericalExpressionStructureProblem, sampleNumericalExpressionFrame} from '../numerical-expression-domain.ts';
import {
    ArithmeticNumericalExpressionsGeneratorConfig,
    ArithmeticNumericalExpressionsGeneratorSchema
} from './spec.ts';

export class ArithmeticNumericalExpressionsGenerator implements ProblemGenerator<
    NumericalExpressionStructureProblem,
    ArithmeticNumericalExpressionsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticNumericalExpressionsGeneratorSchema;

    generate(config: ArithmeticNumericalExpressionsGeneratorConfig): ProblemStub<NumericalExpressionStructureProblem> | null {
        validateConfigFields('arithmetic-numerical-expressions', config, ['profile']);
        const frame = sampleNumericalExpressionFrame(numericalExpressionRows('structure', config.profile!), random);
        return frame ? {data: numericalExpressionStructureProblem(frame)} : null;
    }
}
