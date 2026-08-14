import {Area} from 'edugraph-ts';
import {random} from '../../lib/random.ts';

export const arithmeticOperations = [
    Area.Addition,
    Area.Subtraction,
    Area.Multiplication,
    Area.Division
] as const;

export type ArithmeticOperationLabel = typeof arithmeticOperations[number];

export type AddSubtractOperationLabel = typeof Area.Addition | typeof Area.Subtraction;

export type TwoStepOperationLabels = readonly [
    AddSubtractOperationLabel,
    AddSubtractOperationLabel
];

/** Resolves only an explicitly requested operation, never a related ontology label. */
export function resolveExplicitOperation(labels: string[]): ArithmeticOperationLabel | 'unsupported' {
    // Preserve the schema-array resolver's single RNG draw for stable pair samples.
    random();
    return arithmeticOperations.find(operation => labels.includes(operation)) ?? 'unsupported';
}

/** Resolves multiplication for a distributive-law target that also names addition. */
export function resolvePropertyAwareOperation(labels: string[]): ArithmeticOperationLabel | 'unsupported' {
    if (labels.includes(Area.DistributiveLaw)) {
        random();
        return Area.Multiplication;
    }
    return resolveExplicitOperation(labels);
}

/** Resolves the operation sequence required by a connected two-step word problem. */
export function resolveTwoStepOperations(labels: string[]): TwoStepOperationLabels | 'unsupported' {
    const hasAddition = labels.includes(Area.Addition);
    const hasSubtraction = labels.includes(Area.Subtraction);

    if (hasAddition && hasSubtraction) return [Area.Addition, Area.Subtraction];
    if (hasAddition) return [Area.Addition, Area.Addition];
    if (hasSubtraction) return [Area.Subtraction, Area.Subtraction];
    return 'unsupported';
}

export const operationNames: Record<ArithmeticOperationLabel, 'addition' | 'subtraction' | 'multiplication' | 'division'> = {
    [Area.Addition]: 'addition',
    [Area.Subtraction]: 'subtraction',
    [Area.Multiplication]: 'multiplication',
    [Area.Division]: 'division'
};
