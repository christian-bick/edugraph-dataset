import {validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {ArithmeticPropertyProblem, ArithmeticTripleProblem} from '../../../types/problems.ts';
import {sampleCanonicalTriple} from '../canonical-triple-sampling.ts';
import {operationNames} from '../helpers.ts';
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
        if ([config.useCommutativeLaw, config.useAssociativeLaw, config.useDistributiveLaw].filter(Boolean).length !== 1
            || config.useDistributiveLaw && (config.requireZero || config.requireMultipleOf10)) return null;
        const data = sampleCanonicalTriple({...config, operation: operationNames[config.operation!],
            requireTwoDigitOperands: false} as Parameters<typeof sampleCanonicalTriple>[0]);
        if (!data || !hasCompleteProperty(data)) return null;
        return {data};
    }
}
