export function formatParityGrouping(groupSize: number, remainder: 0 | 1): string {
    return remainder === 0
        ? `2 groups of ${groupSize}, none left over`
        : `2 groups of ${groupSize}, 1 left over`;
}
