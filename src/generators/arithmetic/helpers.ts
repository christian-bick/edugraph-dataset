import {Area} from 'edugraph-ts';
import {random} from '../../lib/random.ts';

export const arithmeticOperations = [
    Area.Addition,
    Area.Subtraction,
    Area.Multiplication,
    Area.Division
] as const;

export type ArithmeticOperationLabel = typeof arithmeticOperations[number];

/** Resolves only an explicitly requested operation, never a related ontology label. */
export function resolveExplicitOperation(labels: string[]): ArithmeticOperationLabel | 'unsupported' {
    // Preserve the schema-array resolver's single RNG draw for stable pair samples.
    random();
    return arithmeticOperations.find(operation => labels.includes(operation)) ?? 'unsupported';
}

export const operationNames: Record<ArithmeticOperationLabel, 'addition' | 'subtraction' | 'multiplication' | 'division'> = {
    [Area.Addition]: 'addition',
    [Area.Subtraction]: 'subtraction',
    [Area.Multiplication]: 'multiplication',
    [Area.Division]: 'division'
};
