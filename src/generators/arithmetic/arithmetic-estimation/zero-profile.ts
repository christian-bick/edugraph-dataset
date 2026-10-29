import {Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import type {ArithmeticOperation} from '../../../types/problems.ts';
import {arithmeticOperations, operationNames} from '../helpers.ts';
import {hasEstimationProfile} from './numeric-domain.ts';

export const estimationZeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero] as const;
export const estimationZeroContext = [...arithmeticOperations, ...resolveRangeFromLabels.labelChoices!.contextLabels!] as const;
export const permitsEstimationZero = (selected: (label: string) => boolean, presence: boolean): boolean => {
    const operation = arithmeticOperations.find(label => selected(label));
    if (!operation) return true; // Standalone exact fallback-contract validation.
    const range = resolveRangeFromLabels(estimationZeroContext.filter(label => selected(label)));
    return hasEstimationProfile({operation: operationNames[operation] as ArithmeticOperation,
        minimum: Math.max(0, Math.ceil(range.min)), maximum: Math.min(1000, Math.floor(range.max))}, presence);
};
export const resolveEstimationZero = withLabelChoices(exactResolver((labels: string[]): boolean | undefined => {
    const selected = (label: string) => labels.includes(label);
    const zero = selected(Scope.NumbersWithZero), absence = selected(Scope.NumbersWithoutZero);
    if (zero === absence) return undefined;
    return permitsEstimationZero(selected, zero) ? zero : undefined;
}), {kind: 'alternatives', alternatives: estimationZeroLabels.map(label => [label]),
    contextLabels: estimationZeroContext, resolvedContext: true});
