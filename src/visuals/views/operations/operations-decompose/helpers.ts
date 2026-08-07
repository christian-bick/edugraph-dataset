export interface DecomposeDotPosition {
    left: number;
    top: number;
}

export interface DecomposeLayout {
    height: number;
    iconSize: number;
    positions: DecomposeDotPosition[];
}

const CARD_WIDTH = 200;
const SINGLE_ROW_ICON_SIZE = 15;
const WRAPPED_ICON_SIZE = 10;
const MAX_COLUMNS = 18;
const GAP = 3;
const VERTICAL_PADDING = 12;

export function getDecomposeLayout(a: number, b: number): DecomposeLayout {
    const total = a + b;
    const isWrapped = total > MAX_COLUMNS;
    const iconSize = isWrapped ? WRAPPED_ICON_SIZE : SINGLE_ROW_ICON_SIZE;
    const columns = Math.min(total, MAX_COLUMNS);
    const rows = Math.ceil(total / MAX_COLUMNS);
    const horizontalGap = isWrapped ? 1 : GAP;
    const horizontalStep = iconSize + horizontalGap;
    const verticalStep = iconSize + GAP;
    const contentHeight = rows * iconSize + Math.max(0, rows - 1) * GAP;
    const height = Math.max(50, contentHeight + VERTICAL_PADDING);
    const startTop = (height - contentHeight) / 2;

    const positions = Array.from({ length: total }, (_, index) => {
        const row = Math.floor(index / MAX_COLUMNS);
        const column = index % MAX_COLUMNS;
        const rowCount = Math.min(columns, total - row * MAX_COLUMNS);
        const rowWidth = rowCount * iconSize + Math.max(0, rowCount - 1) * horizontalGap;

        return {
            left: (CARD_WIDTH - rowWidth) / 2 + column * horizontalStep,
            top: startTop + row * verticalStep
        };
    });

    return { height, iconSize, positions };
}
