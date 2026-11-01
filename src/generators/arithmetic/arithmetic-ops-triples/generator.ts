import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticTripleProblem} from '../../../types/problems.ts';
import {sampleCanonicalTriple} from '../canonical-triple-sampling.ts';
import {operationNames} from '../helpers.ts';
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
            'useDistributiveLaw',
            'requireTwoDigitOperands'
        ]);

        if (config.operation === 'unsupported') return null;
        const data = sampleCanonicalTriple({...config, operation: operationNames[config.operation!]} as Parameters<typeof sampleCanonicalTriple>[0]);
        return data ? {data} : null;
    }
}
