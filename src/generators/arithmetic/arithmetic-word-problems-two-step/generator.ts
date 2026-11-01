import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticWordProblemTwoStep} from '../../../types/problems.ts';
import {ArithmeticWordProblemsTwoStepGeneratorConfig, ArithmeticWordProblemsTwoStepGeneratorSchema} from './spec.ts';
import {operationNames} from '../helpers.ts';
import {random} from '../../../lib/random.ts';
import {twoStepDomain, twoStepFrame} from './domain.ts';
export class ArithmeticWordProblemsTwoStepGenerator implements ProblemGenerator<ArithmeticWordProblemTwoStep, ArithmeticWordProblemsTwoStepGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticWordProblemsTwoStepGeneratorSchema;

    generate(config: ArithmeticWordProblemsTwoStepGeneratorConfig): ProblemStub<ArithmeticWordProblemTwoStep> | null {
        validateConfigFields('arithmetic-word-problems-two-step', config, ['operations', 'range']);
        const operations = config.operations!;
        if (operations === 'unsupported') return null;
        const namedOperations = [operationNames[operations[0]], operationNames[operations[1]]] as const;
        const domain = twoStepDomain(namedOperations, config.range!);
        return domain.count ? {data: twoStepFrame(domain, namedOperations, Math.floor(random() * domain.count))} : null;
    }
}
