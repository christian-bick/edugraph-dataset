import {Area, Scope} from 'edugraph-ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const resultZeroContext = [Area.Addition, Area.AdditionPlaceValuePartitioning,
    Area.IntegerRegrouping, Scope.TwoDigitLargestOperand] as const;

// Reviewed deterministic owner resolver. This target-only binding retains the original
// explicit equality request; later coefficient-presence selections cannot change it.
// Addition and borrowed subtraction stay positive even when their coefficients include 0.
export const resolveResultZero = registerStaticResolver(withLabelChoices(exactResolver(
    (labels: string[]): boolean | undefined => {
        const zero = labels.includes(Scope.NumbersWithZero);
        return zero && !labels.includes(Area.IntegerRegrouping)
            && !labels.includes(Area.Addition) && !labels.includes(Area.AdditionPlaceValuePartitioning);
    }
), {
    kind: 'target', contextLabels: resultZeroContext, resolvedContext: true
}));
