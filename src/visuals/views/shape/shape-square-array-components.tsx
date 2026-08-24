export type SquareGridGeometry = {
    rows: number;
    columns: number;
    cellCount: number;
};

const CELL_SIZE = 44;

export const UnitSquareDiagram = () => (
    <svg
        viewBox="0 0 340 260"
        className="h-[260px] w-[340px]"
        aria-label="A square tile with side lengths of 1 unit"
    >
        <rect x="92" y="38" width="156" height="156" rx="4" fill="#ede9fe" stroke="#6d28d9" strokeWidth="5" />
        <line x1="92" y1="215" x2="248" y2="215" stroke="#475569" strokeWidth="2" />
        <line x1="92" y1="208" x2="92" y2="222" stroke="#475569" strokeWidth="2" />
        <line x1="248" y1="208" x2="248" y2="222" stroke="#475569" strokeWidth="2" />
        <text x="170" y="240" textAnchor="middle" className="fill-slate-700 text-[16px] font-bold">1 unit</text>
        <line x1="70" y1="38" x2="70" y2="194" stroke="#475569" strokeWidth="2" />
        <line x1="63" y1="38" x2="77" y2="38" stroke="#475569" strokeWidth="2" />
        <line x1="63" y1="194" x2="77" y2="194" stroke="#475569" strokeWidth="2" />
        <text x="43" y="116" textAnchor="middle" transform="rotate(-90 43 116)" className="fill-slate-700 text-[16px] font-bold">1 unit</text>
        <text x="170" y="123" textAnchor="middle" className="fill-violet-800 text-[18px] font-extrabold">unit square</text>
    </svg>
);

export const SquareGridDiagram = ({
    geometry,
    showCells,
    showCount,
    showCountingPath = false,
    showSideLengths,
    hiddenDimension
}: {
    geometry: SquareGridGeometry;
    showCells: boolean;
    showCount: boolean;
    showCountingPath?: boolean;
    showSideLengths: boolean;
    hiddenDimension?: 'length' | 'width';
}) => {
    const {rows, columns, cellCount} = geometry;
    const width = columns * CELL_SIZE;
    const height = rows * CELL_SIZE;
    const x = (340 - width) / 2;
    const y = (220 - height) / 2 + 28;

    return (
        <svg
            viewBox="0 0 340 260"
            className="h-[260px] w-[340px]"
            aria-label={hiddenDimension
                ? `Equal-square array with unknown ${hiddenDimension}`
                : `${rows} rows and ${columns} columns of equal squares`}
        >
            <rect x={x} y={y} width={width} height={height} rx="3" fill="#f8fafc" stroke="#334155" strokeWidth="5" />
            {showCells && Array.from({length: cellCount}, (_, index) => {
                const row = Math.floor(index / columns);
                const column = index % columns;
                const isEvenRow = row % 2 === 0;
                const pathIndex = row * columns + (isEvenRow ? column : columns - column - 1);
                const pathArrow = pathIndex === cellCount - 1 ? '' : isEvenRow
                    ? column === columns - 1 ? '↓' : '→'
                    : column === 0 ? '↓' : '←';
                return (
                    <g key={index}>
                        <rect
                            x={x + column * CELL_SIZE}
                            y={y + row * CELL_SIZE}
                            width={CELL_SIZE}
                            height={CELL_SIZE}
                            fill={(row + column) % 2 === 0 ? '#dbeafe' : '#eff6ff'}
                            stroke="#475569"
                            strokeWidth="2"
                        />
                        {showCount && (
                            <text
                                x={x + column * CELL_SIZE + CELL_SIZE / 2}
                                y={y + row * CELL_SIZE + CELL_SIZE / 2 + 6}
                                textAnchor="middle"
                                className="fill-slate-700 text-[15px] font-bold"
                            >
                                {index + 1}
                            </text>
                        )}
                        {showCountingPath && !showCount && (
                            <>
                                {pathIndex === 0 && (
                                    <text
                                        x={x + column * CELL_SIZE + CELL_SIZE / 2}
                                        y={y + row * CELL_SIZE + 15}
                                        textAnchor="middle"
                                        className="fill-blue-700 text-[8px] font-extrabold uppercase"
                                    >
                                        start
                                    </text>
                                )}
                                {pathArrow && (
                                    <text
                                        x={x + column * CELL_SIZE + CELL_SIZE / 2}
                                        y={y + row * CELL_SIZE + CELL_SIZE / 2 + 9}
                                        textAnchor="middle"
                                        className="fill-blue-700 text-[23px] font-black"
                                    >
                                        {pathArrow}
                                    </text>
                                )}
                            </>
                        )}
                    </g>
                );
            })}
            <text x={x + width / 2} y={y - 13} textAnchor="middle" className="fill-slate-600 text-[15px] font-bold">
                {hiddenDimension === 'length'
                    ? '? units'
                    : showSideLengths ? `${columns} units` : `${columns} columns`}
            </text>
            <text
                x={x - 16}
                y={y + height / 2}
                textAnchor="middle"
                transform={`rotate(-90 ${x - 16} ${y + height / 2})`}
                className="fill-slate-600 text-[15px] font-bold"
            >
                {hiddenDimension === 'width'
                    ? '? units'
                    : showSideLengths ? `${rows} units` : `${rows} rows`}
            </text>
        </svg>
    );
};
