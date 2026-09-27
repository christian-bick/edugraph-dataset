import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticTripleProblem} from '../../../types/problems.ts';
import {sampleArithmeticTriple} from '../arithmetic-triple-sampling.ts';
import {ArithmeticOpsTriplesGeneratorConfig, ArithmeticOpsTriplesGeneratorSchema} from './spec.ts';

export class ArithmeticOpsTriplesGenerator implements ProblemGenerator<ArithmeticTripleProblem, ArithmeticOpsTriplesGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticOpsTriplesGeneratorSchema;

    generate(config: ArithmeticOpsTriplesGeneratorConfig): ProblemStub<ArithmeticTripleProblem> | null {
        validateConfigFields('arithmetic-ops-triples', config, [
            'range',
            'operation',
            'requireZero',
            'requireMultipleOf10',
            'useCommutativeLaw',
            'useAssociativeLaw',
            'useDistributiveLaw'
        ]);

        return sampleArithmeticTriple(config);
    }
}
