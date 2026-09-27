import {validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {ArithmeticPropertyProblem, ArithmeticTripleProblem} from '../../../types/problems.ts';
import {isFeasibleArithmeticProperty} from '../arithmetic-property-domain.ts';
import {sampleArithmeticTriple} from '../arithmetic-triple-sampling.ts';
import {ArithmeticPropertyRelationsGeneratorConfig, ArithmeticPropertyRelationsGeneratorSchema} from './spec.ts';

function hasCompleteProperty(data: ArithmeticTripleProblem): data is ArithmeticPropertyProblem {
    if (data.propertyLaw === 'distributive') {
        return data.operation === 'multiplication' && data.combinedFactor !== undefined && data.partialProducts !== undefined;
    }
    return (data.propertyLaw === 'commutative' || data.propertyLaw === 'associative')
        && (data.operation === 'addition' || data.operation === 'multiplication');
}

export class ArithmeticPropertyRelationsGenerator implements ProblemGenerator<ArithmeticPropertyProblem, ArithmeticPropertyRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticPropertyRelationsGeneratorSchema;

    generate(config: ArithmeticPropertyRelationsGeneratorConfig): ProblemStub<ArithmeticPropertyProblem> | null {
        validateConfigFields('arithmetic-property-relations', config, [
            'range', 'operation', 'requireZero', 'requireMultipleOf10',
            'useCommutativeLaw', 'useAssociativeLaw', 'useDistributiveLaw'
        ]);
        if (!isFeasibleArithmeticProperty(config)) return null;
        const stub = sampleArithmeticTriple(config, {boundIntermediateProducts: true});
        if (!stub || !hasCompleteProperty(stub.data)) return null;
        const data = stub.data;
        if (data.propertyLaw === 'commutative' && data.num1 === data.num3) {
            if (data.num1 === data.num2) return null;
            // Expose an existing distinct operand at an outer position without another random draw.
            return {data: {...data, num2: data.num3, num3: data.num2}};
        }
        return {data};
    }
}
