import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticOperationTablePatternProblem} from '../../../types/problems.ts';
import {ArithmeticOperationTableGeneratorConfig, ArithmeticOperationTableGeneratorSchema} from './spec.ts';
import {operationTableProblem, operationTableRows} from './domain.ts';

export class ArithmeticOperationTableGenerator implements ProblemGenerator<
    ArithmeticOperationTablePatternProblem,
    ArithmeticOperationTableGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticOperationTableGeneratorSchema;

    generate(config: ArithmeticOperationTableGeneratorConfig): ProblemStub<ArithmeticOperationTablePatternProblem> | null {
        validateConfigFields('arithmetic-operation-table', config, ['operation', 'range']);
        if (config.operation !== 'addition' && config.operation !== 'multiplication') return null;
        const range = config.range!;
        if (!range || ![10, 20, 100].includes(range.max) || range.min !== 0) {
            throw new GeneratorValidationError('arithmetic-operation-table', 'Expected a reviewed canonical row range.');
        }
        const expected = createCanonicalNumericRange(range.max);
        if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
            throw new GeneratorValidationError('arithmetic-operation-table', 'Canonical range witnesses are missing or inconsistent.');
        }
        const rows = operationTableRows(config.operation, range);
        return rows.length ? {data: operationTableProblem(config.operation, rows[Math.floor(random() * rows.length)]!)} : null;
    }
}
