import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticPairProblem} from '../../../types/problems.ts';
import {operationNames} from '../helpers.ts';
import {sampleCanonicalPair} from '../canonical-pair-sampling.ts';
import {ArithmeticOpsPairsGeneratorConfig, ArithmeticOpsPairsGeneratorSchema} from './spec.ts';

export class ArithmeticOpsPairsGenerator implements ProblemGenerator<ArithmeticPairProblem, ArithmeticOpsPairsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticOpsPairsGeneratorSchema;

    generate(config: ArithmeticOpsPairsGeneratorConfig): ProblemStub<ArithmeticPairProblem> | null {
        validateConfigFields('arithmetic-ops-pairs', config, ['range', 'operation', 'requireNegative', 'requireZero',
            'requireMultipleOf10', 'requireEqualAddends', 'requireEvenResult', 'largestOperandDigits']);
        if (config.operation === 'unsupported') return null;
        const data = sampleCanonicalPair({...config, operation: operationNames[config.operation!] } as Parameters<typeof sampleCanonicalPair>[0]);
        return data ? {data} : null;
    }
}
