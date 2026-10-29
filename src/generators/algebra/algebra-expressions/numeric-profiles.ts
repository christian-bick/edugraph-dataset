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

export const resolveNumericProfile = withLabelChoices(exactResolver((labels: string[]): AlgebraNumericProfile | undefined => {
    const chosen = numericProfileLabels.filter(label => labels.includes(label));
    const index = numericProfileBundles.findIndex(bundle => bundle.length === chosen.length
        && bundle.every(label => chosen.includes(label)));
    const profile = chosen.length ? index < 0 ? undefined : (index + 1) as AlgebraNumericProfile : 0;
    return profile !== undefined && allowedNumericProfiles(label => labels.includes(label)).includes(profile)
        ? profile : undefined;
}), {kind: 'alternatives', alternatives: [[], ...numericProfileBundles],
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
