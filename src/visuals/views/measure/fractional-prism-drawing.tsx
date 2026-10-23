import type {RectangularPrismCellGroup, UnitCubeCell} from '../../../types/problems.ts';
import {assembledPrismFaces, polygonPoints, prismViewport, projectCubeCorner, type PrismBounds} from './volume-unit-cube-helpers.ts';

const faceColors = {left: '#a5b4fc', right: '#818cf8', top: '#e0e7ff'} as const;
const completedColors = {left: '#6ee7b7', right: '#34d399', top: '#d1fae5'} as const;

export function FractionalPrismDrawing({bounds, packed, completed}: {
    bounds: PrismBounds; packed: boolean; completed: boolean;
}) {
    const {columns: C, rows: R, layers: H} = bounds;
    const viewport = prismViewport(bounds);
    const p = (column: number, row: number, layer: number) => projectCubeCorner(bounds, column, row, layer);
    const outline = [
        {surface: 'left' as const, points: [p(0, R, 0), p(C, R, 0), p(C, R, H), p(0, R, H)]},
        {surface: 'right' as const, points: [p(C, 0, 0), p(C, R, 0), p(C, R, H), p(C, 0, H)]},
        {surface: 'top' as const, points: [p(0, 0, H), p(C, 0, H), p(C, R, H), p(0, R, H)]}
    ];
    const colors = completed ? completedColors : faceColors;
    return <svg role="img" aria-label={packed ? 'Packed rectangular prism with small-cube seams' : 'Unfilled rectangular prism outline'}
        data-role={packed ? 'packed-prism' : 'outline-prism'} viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        className="mx-auto h-[230px] w-full max-w-[330px]">
        {(packed ? assembledPrismFaces(bounds) : outline).map((face, index) => <polygon key={index}
            points={polygonPoints(face.points)} fill={packed ? colors[face.surface] : '#f1f5f9'}
            stroke={completed ? '#047857' : '#475569'} strokeWidth="1.4" strokeLinejoin="round" />)}
    </svg>;
}

function Cube({completed}: {completed: boolean}) {
    const colors = completed ? completedColors : faceColors;
    return <svg aria-hidden="true" viewBox="0 0 40 44" className="h-[26px] w-[24px]">
        <polygon points="20,2 37,12 20,22 3,12" fill={colors.top} stroke="#475569" />
        <polygon points="3,12 20,22 20,41 3,31" fill={colors.left} stroke="#475569" />
        <polygon points="20,22 37,12 37,31 20,41" fill={colors.right} stroke="#475569" />
    </svg>;
}

export function FractionalPrismGroups({groups, columns, filled, completed, axis, ordinals}: {
    groups: readonly RectangularPrismCellGroup[]; columns: number; filled: boolean; completed: boolean;
    axis: 'layer' | 'column'; ordinals: readonly Readonly<{cell: Readonly<UnitCubeCell>; ordinal: number}>[] | undefined;
}) {
    const trace = new Map(ordinals?.map(row => [`${row.cell.layer}:${row.cell.row}:${row.cell.column}`, row.ordinal]));
    return <div className="flex flex-wrap justify-center gap-3" data-role={`${axis}-groups`}>
        {groups.map(group => <div key={group.index} className={`rounded-lg border p-2 ${completed ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
            <p className="mb-2 text-center text-xs font-bold">{axis === 'layer' ? 'Layer' : 'Column slice'} {group.index + 1}</p>
            <div className="grid gap-1" style={{gridTemplateColumns: `repeat(${columns}, 30px)`}}>
                {group.cells.map(cell => {
                    const key = `${cell.layer}:${cell.row}:${cell.column}`;
                    return <div key={key} data-prism-cell={filled ? key : undefined} data-empty-slot={filled ? undefined : 'true'}
                        className={`flex min-h-[32px] flex-col items-center justify-center rounded border ${filled ? 'border-slate-200' : 'border-dashed border-slate-400'}`}>
                        {filled && <Cube completed={completed} />}
                        {filled && trace.has(key) && <span data-role="cube-ordinal" className="text-xs font-bold text-emerald-800">{trace.get(key)}</span>}
                    </div>;
                })}
            </div>
        </div>)}
    </div>;
}
