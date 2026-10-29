import {Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {registerStaticResolver} from '../../lib/static-resolvers.ts';
import {exactResolver, withLabelChoices} from '../../types/schema.ts';

export const writingRangeLabels = resolveRangeFromLabels.labelChoices!.contextLabels!;
export const writingZeroContext = [...writingRangeLabels, Scope.Numberline];
const explicitZeroBounds = writingRangeLabels.filter(label => {
    const {max} = resolveRangeFromLabels([label]);
    return max > 1000 && max <= 1_000_000;
});
const scalarBounds = writingRangeLabels.filter(label => resolveRangeFromLabels([label]).max <= 1000);

// The selector concerns the scalar value, never the digits used to write it.
// Bounded larger requests retain explicit zero choices for matching; a positive
// range can admit only NumbersWithoutZero, including values such as 1005.
export const resolveWritingZero = registerStaticResolver(withLabelChoices(exactResolver(
    (labels: string[]): boolean | undefined => {
        const zero = labels.includes(Scope.NumbersWithZero);
        const absence = labels.includes(Scope.NumbersWithoutZero);
        if (zero && absence) return undefined;
        if (absence && labels.includes(Scope.Numberline)) return undefined;
        const range = resolveRangeFromLabels(labels.filter(label => writingRangeLabels.includes(label)));
        if (zero && (range.min > 0 || range.max < 0)) return undefined;
        if (range.max > 1000 && range.max <= 1_000_000 && !zero && !absence) return undefined;
        return zero;
    }
), {
    kind: 'alternatives', alternatives: [[], [Scope.NumbersWithZero], [Scope.NumbersWithoutZero]],
    contextLabels: writingZeroContext,
    defaults: [
        ...scalarBounds.map(label => ({whenAll: [label], labels: []})),
        {whenNone: explicitZeroBounds, labels: []}
    ]
}));
