import {
    DecimalFractionValue,
    TenthsHundredthsGridGroup,
    TenthsHundredthsGridModel
} from '../../types/problems.ts';

const EPSILON = 0.001;

export const isValidDecimalFraction = (
    value: DecimalFractionValue,
    denominator: 10 | 100
): boolean => typeof value === 'object'
    && value !== null
    && Number.isInteger(value.numerator)
    && value.numerator > 0
    && value.numerator <= denominator
    && value.denominator === denominator
    && value.notation === `${value.numerator}/${denominator}`;

const closeTo = (actual: number, expected: number): boolean =>
    Number.isFinite(actual) && Math.abs(actual - expected) < EPSILON;

export const isValidTenthsHundredthsGrid = (
    model: TenthsHundredthsGridModel,
    value: DecimalFractionValue,
    expectedGroups: readonly TenthsHundredthsGridGroup[] = []
): boolean => {
    if (typeof value !== 'object'
        || value === null
        || (value.denominator !== 10 && value.denominator !== 100)) return false;
    const denominator = value.denominator;
    const rows = denominator === 10 ? 1 : 10;
    if (typeof model !== 'object'
        || model === null
        || model.display !== value.notation
        || model.rows !== rows
        || model.columns !== 10
        || model.partCount !== denominator
        || model.shadedCount !== value.numerator
        || !Array.isArray(model.groups)
        || model.groups.length !== expectedGroups.length
        || !model.groups.every((group, index) => {
            const expected = expectedGroups[index];
            return typeof group === 'object'
                && group !== null
                && expected !== undefined
                && group.source === expected.source
                && group.label === expected.label
                && group.startCell === expected.startCell
                && group.cellCount === expected.cellCount;
        })
        || !Array.isArray(model.cells)
        || model.cells.length !== denominator) return false;

    return model.cells.every((cell, index) => {
        const column = denominator === 10 ? index : Math.floor(index / 10);
        const row = denominator === 10 ? 0 : index % 10;
        const source = expectedGroups.find(group =>
            index >= group.startCell && index < group.startCell + group.cellCount
        )?.source ?? null;
        return typeof cell === 'object'
            && cell !== null
            && cell.index === index
            && cell.row === row
            && cell.column === column
            && cell.tenthGroupIndex === column
            && closeTo(cell.xPercent, column * 10)
            && closeTo(cell.yPercent, row * (denominator === 10 ? 100 : 10))
            && cell.widthPercent === 10
            && cell.heightPercent === (denominator === 10 ? 100 : 10)
            && cell.shaded === (index < value.numerator)
            && cell.source === source;
    });
};
