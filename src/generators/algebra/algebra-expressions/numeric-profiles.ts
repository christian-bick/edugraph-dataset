import {Area, Scope} from 'edugraph-ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import type {AlgebraicScalar, ArithmeticOperation} from '../../../types/problems.ts';

export const numericProfileBundles = [
    [Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero],
    [Scope.NumbersWithoutNegatives, Scope.NumbersWithZero],
    [Scope.NumbersWithNegatives, Scope.NumbersWithoutZero],
    [Scope.NumbersWithNegatives, Scope.NumbersWithZero]
] as const;
export type AlgebraNumericProfile = 0 | 1 | 2 | 3 | 4;
export const numericProfileLabels = [...new Set(numericProfileBundles.flat())];
export const numericProfileChoices = [[], [Scope.NumbersWithoutZero], ...numericProfileBundles] as const;
export const numericContextLabels = [Area.ArithmeticExpression, Area.AlgebraicExpression, Scope.RationalNumbers,
    Area.Term, Area.Factor, Area.Coefficient, Area.Addition, Area.Multiplication, Area.Division,
    Area.GroupingSymbol, Area.Operand, Area.NumericSubstitution, Area.AlgebraicModeling] as const;

/** Only substituted numeric frames and the writer's explicit rational domain are settled here. */
export function allowedNumericProfiles(selected: (label: string) => boolean): readonly AlgebraNumericProfile[] {
    if (!numericContextLabels.some(selected)) return [0, 1, 2, 3, 4];
    if (selected(Area.NumericSubstitution) || selected(Area.AlgebraicModeling)) return [0];
    if (selected(Area.ArithmeticExpression)) return selected(Area.Term) ? [2, 3, 4]
        : selected(Area.Division) ? [1, 3] : [1, 2, 3, 4];
    const structural = [Area.Term, Area.Factor, Area.Coefficient, Area.Addition, Area.Multiplication,
        Area.Division, Area.GroupingSymbol, Area.Operand].some(selected);
    return selected(Area.AlgebraicExpression) && selected(Scope.RationalNumbers) && !structural ? [3, 4] : [0];
}

/** A nonzero numerator divided by a valid symbolic denominator cannot involve zero. */
function isSymbolicQuotient(selected: (label: string) => boolean): boolean {
    return selected(Area.AlgebraicExpression) && selected(Area.Division)
        && !selected(Area.ArithmeticExpression);
}

/** Decode evidence claims without turning a zero-only claim into an invented sign. */
export function numericProfileForLabels(selected: (label: string) => boolean): AlgebraNumericProfile | undefined {
    const chosen = numericProfileLabels.filter(selected);
    const quotient = isSymbolicQuotient(selected);
    if (chosen.length === 1 && chosen[0] === Scope.NumbersWithoutZero) {
        return quotient || !numericContextLabels.some(selected) ? 0 : undefined;
    }
    if (!chosen.length && quotient) return undefined;
    const index = numericProfileBundles.findIndex(bundle => bundle.length === chosen.length
        && bundle.every(label => chosen.includes(label)));
    const profile = chosen.length ? index < 0 ? undefined : (index + 1) as AlgebraNumericProfile : 0;
    return profile !== undefined && allowedNumericProfiles(selected).includes(profile)
        ? profile : undefined;
}

export const resolveNumericProfile = withLabelChoices(exactResolver((labels: string[]) =>
    numericProfileForLabels(label => labels.includes(label))), {kind: 'alternatives', alternatives: numericProfileChoices,
    contextLabels: numericContextLabels, resolvedContext: true});

export interface ExpressionInputs {
    a: number;
    b: number;
    c: number;
    input: AlgebraicScalar;
    operation?: ArithmeticOperation;
}

/** Exact signs/zeros of the visible numeric frame and its signed additive components. */
export function inputsMeetNumericProfile(relation: string, inputs: ExpressionInputs, profile: AlgebraNumericProfile): boolean {
    if (profile === 0) return true;
    // The writer displays the rational domain; its quotient additionally excludes zero.
    if (relation === 'plain') return profile === (inputs.operation === 'division' ? 3 : 4);
    const {a, b, c} = inputs;
    let {numerator: n, denominator: d} = inputs.input;
    if (relation === 'numeric-quotient' && n === 0) { n = -1; d = 2; }
    const values = relation === 'numeric-terms' ? [a, b, c, n, a * n, b * n,
        (a - b) * n, (a - b) * n + c * d, -b * n]
        : relation === 'numeric-sum' ? [a, n, a * d + n]
            : relation === 'numeric-quotient' ? [a, n, n < 0 ? -a * d : a * d]
                : [a, b, n, n + b * d, a * (n + b * d)];
    return values.some(value => value < 0) === (profile > 2)
        && values.some(value => value === 0) === (profile % 2 === 0);
}

export function profilesForRelation(relation: string): readonly AlgebraNumericProfile[] {
    return relation === 'plain' ? [3, 4] : relation === 'numeric-terms' ? [2, 3, 4]
        : relation === 'numeric-quotient' ? [1, 3] : relation.startsWith('numeric-') ? [1, 2, 3, 4] : [0];
}
