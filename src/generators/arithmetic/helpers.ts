import {Area} from 'edugraph-ts';
import {random} from '../../lib/random.ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../lib/resolvers.ts';
import {compositionalResolver, exactResolver} from '../../types/schema.ts';

export const arithmeticOperations = [
    Area.Addition,
    Area.Subtraction,
    Area.Multiplication,
    Area.Division
] as const;

export type ArithmeticOperationLabel = typeof arithmeticOperations[number];

export type AddSubtractOperationLabel = typeof Area.Addition | typeof Area.Subtraction;

export type TwoStepOperationLabels = readonly [ArithmeticOperationLabel, ArithmeticOperationLabel];

const resolveDeclaredOperationLabel = selectExactLabelMap(
    arithmeticOperations.map(operation => [operation, operation] as const)
);

/** Resolves only an explicitly requested operation, never a related ontology label. */
export function resolveDeclaredOperation(labels: string[]): ArithmeticOperationLabel | 'unsupported' {
    // Preserve the schema-array resolver's single RNG draw for stable pair samples.
    random();
    return resolveDeclaredOperationLabel(labels) ?? 'unsupported';
}

/** Resolves multiplication for a distributive-law target that also names addition. */
export function resolvePropertyAwareOperation(labels: string[]): ArithmeticOperationLabel | 'unsupported' {
    if (labels.includes(Area.DistributiveLaw)) {
        random();
        const operations = arithmeticOperations.filter(operation => labels.includes(operation));
        const isMultiplicationTarget = operations.length === 1
            && operations[0] === Area.Multiplication;
        const isExpandedDistributiveTarget = operations.length === 2
            && operations.includes(Area.Addition)
            && operations.includes(Area.Multiplication);
        if (!isMultiplicationTarget && !isExpandedDistributiveTarget) {
            throw new Error(`Unsupported distributive operation combination: ${operations.join(' + ')}`);
        }
        return Area.Multiplication;
    }
    random();
    return selectExactLabelSetMap([
        [[Area.Addition], Area.Addition],
        [[Area.Addition, Area.Sum], Area.Addition],
        [[Area.Subtraction], Area.Subtraction],
        [[Area.Multiplication], Area.Multiplication],
        [[Area.Division], Area.Division]
    ] as const)(labels) ?? 'unsupported';
}

/** Resolves the operation sequence required by a connected two-step word problem. */
export function resolveTwoStepOperations(labels: string[]): TwoStepOperationLabels | 'unsupported' {
    const hasAddition = labels.includes(Area.Addition);
    const hasSubtraction = labels.includes(Area.Subtraction);
    const hasMultiplication = labels.includes(Area.Multiplication);
    const hasDivision = labels.includes(Area.Division);

    if (hasAddition && hasSubtraction) return [Area.Addition, Area.Subtraction];
    if (hasAddition && hasMultiplication) return [Area.Multiplication, Area.Addition];
    if (hasAddition && hasDivision) return [Area.Division, Area.Addition];
    if (hasSubtraction && hasMultiplication) return [Area.Multiplication, Area.Subtraction];
    if (hasSubtraction && hasDivision) return [Area.Division, Area.Subtraction];
    if (hasMultiplication && hasDivision) return [Area.Multiplication, Area.Division];
    if (hasAddition) return [Area.Addition, Area.Addition];
    if (hasSubtraction) return [Area.Subtraction, Area.Subtraction];
    if (hasMultiplication) return [Area.Multiplication, Area.Multiplication];
    if (hasDivision) return [Area.Division, Area.Division];
    return 'unsupported';
}

exactResolver(resolveDeclaredOperation);
exactResolver(resolvePropertyAwareOperation);
compositionalResolver(resolveTwoStepOperations);

export const operationNames: Record<ArithmeticOperationLabel, 'addition' | 'subtraction' | 'multiplication' | 'division'> = {
    [Area.Addition]: 'addition',
    [Area.Subtraction]: 'subtraction',
    [Area.Multiplication]: 'multiplication',
    [Area.Division]: 'division'
};
