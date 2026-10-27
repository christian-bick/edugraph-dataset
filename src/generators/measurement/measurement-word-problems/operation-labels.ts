import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {resolveDeclaredOperation} from '../../arithmetic/helpers.ts';

const operationMappings = [
    [[Area.Addition], Area.Addition],
    [[Area.Subtraction], Area.Subtraction],
    [[Area.Multiplication], Area.Multiplication],
    [[Area.Division], Area.Division]
] as const;

const selectOperation = selectExactLabelSetMap(operationMappings);

export const measurementWordProblemOperationChoices = operationMappings.map(([labels]) => labels);

/** Validate the declared bundle, then preserve the existing operation resolver's entropy consumption. */
export const resolveMeasurementWordProblemOperation = withLabelChoices(exactResolver((labels: string[]) => {
    const operation = selectOperation(labels);
    return operation === undefined ? undefined : resolveDeclaredOperation([operation]);
}), selectOperation.labelChoices!);

const operandDigitMappings = [
    [[], false],
    [[Scope.SingleDigitSmallestOperand], {role: 'smallest', digits: 1}],
    [[Scope.SingleDigitLargestOperand], {role: 'largest', digits: 1}],
    [[Scope.TwoDigitLargestOperand], {role: 'largest', digits: 2}],
    [[Scope.SingleDigitDivisor], {role: 'divisor', digits: 1}]
] as const;

export const measurementWordProblemOperandDigitChoices = operandDigitMappings.map(([labels]) => labels);

// An unspecified width must leave every choice available to compatibility, rather
// than selecting the exact-map helper's default empty binding before planning.
export const resolveMeasurementWordProblemOperandDigits = withLabelChoices(
    selectExactLabelSetMap(operandDigitMappings),
    {kind: 'alternatives', alternatives: measurementWordProblemOperandDigitChoices}
);
