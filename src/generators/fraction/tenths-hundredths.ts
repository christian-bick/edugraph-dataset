import {
    DecimalFractionValue,
    TenthsHundredthsGridGroup,
    TenthsHundredthsGridModel
} from '../../types/problems.ts';

export const toDecimalFraction = <Denominator extends 10 | 100>(
    numerator: number,
    denominator: Denominator
): DecimalFractionValue & {denominator: Denominator} => ({
    numerator,
    denominator,
    notation: `${numerator}/${denominator}`
});

export const toTenthsHundredthsGrid = (
    numerator: number,
    denominator: 10 | 100,
    groups: readonly TenthsHundredthsGridGroup[] = []
): TenthsHundredthsGridModel => {
    const rows = denominator === 10 ? 1 as const : 10 as const;
    const heightPercent = denominator === 10 ? 100 as const : 10 as const;
    const cells = Array.from({length: denominator}, (_, index) => {
        const row = denominator === 10 ? 0 : index % 10;
        const column = denominator === 10 ? index : Math.floor(index / 10);
        return {
            index,
            row,
            column,
            tenthGroupIndex: column,
            xPercent: column * 10,
            yPercent: row * heightPercent,
            widthPercent: 10 as const,
            heightPercent,
            shaded: index < numerator,
            source: groups.find(group =>
                index >= group.startCell && index < group.startCell + group.cellCount
            )?.source ?? null
        };
    });

    return {
        display: `${numerator}/${denominator}`,
        rows,
        columns: 10,
        partCount: denominator,
        shadedCount: numerator,
        groups: [...groups],
        cells
    };
};
