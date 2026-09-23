import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticOperationTablePatternProblem} from '../../../types/problems.ts';
import {ArithmeticOperationTableGeneratorConfig, ArithmeticOperationTableGeneratorSchema} from './spec.ts';

export class ArithmeticOperationTableGenerator implements ProblemGenerator<
    ArithmeticOperationTablePatternProblem,
    ArithmeticOperationTableGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticOperationTableGeneratorSchema;

    generate(config: ArithmeticOperationTableGeneratorConfig): ProblemStub<ArithmeticOperationTablePatternProblem> | null {
        validateConfigFields('arithmetic-operation-table', config, ['operation']);
        if (config.operation !== 'addition' && config.operation !== 'multiplication') return null;
        const operands = [0, 1, 2, 3, 4, 5, 6];
        return {data: {
            kind: 'operation-table',
            operation: config.operation,
            operands,
            values: operands.map(row => operands.map(column =>
                config.operation === 'addition' ? row + column : row * column
            ))
        }};
    }
}
