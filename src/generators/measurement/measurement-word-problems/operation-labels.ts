import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {resolveDeclaredOperation} from '../../arithmetic/helpers.ts';

const operationMappings = [
    [[Area.Addition], Area.Addition],
    [[Area.Subtraction], Area.Subtraction],
    [[Area.Multiplication, Scope.SingleDigitSmallestOperand], Area.Multiplication],
    [[Area.Multiplication, Scope.SingleDigitLargestOperand], Area.Multiplication],
    [[Area.Division, Scope.SingleDigitDivisor], Area.Division]
] as const;

const selectOperation = selectExactLabelSetMap(operationMappings);

export const measurementWordProblemOperationChoices = operationMappings.map(([labels]) => labels);

/** Validate the declared bundle, then preserve the existing operation resolver's entropy consumption. */
export const resolveMeasurementWordProblemOperation = withLabelChoices(exactResolver((labels: string[]) => {
    const operation = selectOperation(labels);
    return operation === undefined ? undefined : resolveDeclaredOperation([operation]);
}), selectOperation.labelChoices!);
