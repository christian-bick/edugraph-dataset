import {Area, Scope} from 'edugraph-ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const resultZeroContext = [Area.Addition, Area.AdditionPlaceValuePartitioning,
    Scope.TwoDigitLargestOperand] as const;

// Reviewed deterministic owner resolver. In Grade-1 addition, both primary operands
// have a displayed zero hundreds coefficient, while the arithmetic result stays positive.
// The function maps label evidence to the existing result-zero flag without changing math.
export const resolveResultZero = registerStaticResolver(withLabelChoices(exactResolver(
    (labels: string[]): boolean | undefined => {
        const zero = labels.includes(Scope.NumbersWithZero);
        const absence = labels.includes(Scope.NumbersWithoutZero);
        if (zero && absence) return undefined;
        const gradeOneAddition = labels.includes(Scope.TwoDigitLargestOperand)
            && (labels.includes(Area.Addition) || labels.includes(Area.AdditionPlaceValuePartitioning));
        if (gradeOneAddition) return zero && !absence ? false : undefined;
        return zero;
    }
), {
    kind: 'alternatives', alternatives: [[], [Scope.NumbersWithZero], [Scope.NumbersWithoutZero]],
    contextLabels: resultZeroContext, resolvedContext: true,
    defaults: [
        {whenAll: [Area.Addition, Scope.TwoDigitLargestOperand], labels: [Scope.NumbersWithZero]},
        {whenAll: [Area.AdditionPlaceValuePartitioning, Scope.TwoDigitLargestOperand], labels: [Scope.NumbersWithZero]},
        {labels: []}
    ]
}));
