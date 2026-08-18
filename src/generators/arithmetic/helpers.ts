import {Ability, Area} from 'edugraph-ts';
import {random} from '../../lib/random.ts';

export const arithmeticOperations = [
    Area.Addition,
    Area.Subtraction,
    Area.Multiplication,
    Area.Division
] as const;

export type ArithmeticOperationLabel = typeof arithmeticOperations[number];

export type AddSubtractOperationLabel = typeof Area.Addition | typeof Area.Subtraction;

export type TwoStepOperationLabels = readonly [ArithmeticOperationLabel, ArithmeticOperationLabel];

export type ArithmeticWordProblemTask =
    | 'two-step'
    | 'interpreted-remainder'
    | 'letter-equation'
    | 'reasonableness';

export type ArithmeticPatternTask =
    | 'legacy-identify'
    | 'legacy-explain'
    | 'generate'
    | 'identify-feature'
    | 'explain-feature';

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

/** Resolves the Grade 4 mathematical task while preserving the legacy two-step default. */
export function resolveArithmeticWordProblemTask(labels: string[]): ArithmeticWordProblemTask {
    if (labels.includes(Area.Estimation) || labels.includes(Area.IntegerRounding)) {
        return 'reasonableness';
    }
    if (labels.includes(Area.ImperfectDivisibility) || labels.includes(Area.Modulo)) {
        return 'interpreted-remainder';
    }
    if (labels.includes(Area.Equation)) return 'letter-equation';
    return 'two-step';
}

/** Keeps Grade 3 table identification distinct from Grade 4 rule generation and analysis. */
export function resolveArithmeticPatternTask(labels: string[]): ArithmeticPatternTask | undefined {
    const hasLaw = [
        Area.CommutativeLaw,
        Area.AssociativeLaw,
        Area.DistributiveLaw
    ].some(law => labels.includes(law));
    const generatesPattern = labels.includes(Area.PatternGeneration);
    const recognizesEmergentFeature = labels.includes(Area.EmergentFeatureRecognition);
    const classifies = labels.includes(Ability.ConceptClassification);
    const executes = labels.includes(Ability.ProcedureExecution);
    if (recognizesEmergentFeature) return hasLaw ? 'explain-feature' : 'identify-feature';
    if (generatesPattern) return 'generate';
    if (hasLaw) return executes ? 'explain-feature' : 'legacy-explain';
    if (classifies && executes) return 'identify-feature';
    if (executes) return 'generate';
    if (classifies) return 'legacy-identify';
    return undefined;
}

export const operationNames: Record<ArithmeticOperationLabel, 'addition' | 'subtraction' | 'multiplication' | 'division'> = {
    [Area.Addition]: 'addition',
    [Area.Subtraction]: 'subtraction',
    [Area.Multiplication]: 'multiplication',
    [Area.Division]: 'division'
};
