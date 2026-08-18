import {TenthsHundredthsGridModel} from '../../types/problems.ts';

export const TenthsHundredthsGrid = ({
    model,
    title,
    ariaLabel,
    showDisplay = true,
    compact = false
}: {
    model: TenthsHundredthsGridModel;
    title: string;
    ariaLabel: string;
    showDisplay?: boolean;
    compact?: boolean;
}) => (
    <div
        className={`rounded-xl border-2 border-slate-200 bg-white ${compact ? 'p-3' : 'p-4'}`}
        role="img"
        aria-label={ariaLabel}
    >
        <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-extrabold uppercase tracking-[0.08em] text-slate-600">
                {title}
            </span>
            {showDisplay && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-sm font-bold text-slate-700">
                    {model.display}
                </span>
            )}
        </div>
        <div className={`relative mx-auto overflow-hidden rounded-lg border-[3px] border-slate-700 bg-white ${
            compact ? 'h-[150px] w-[300px]' : 'h-[190px] w-[380px]'
        }`} aria-hidden="true">
            {model.cells.map(cell => (
                <div
                    key={cell.index}
                    className={`absolute border-slate-500 ${
                        cell.source === 'second-addend'
                            ? 'bg-amber-300'
                            : cell.shaded
                                ? 'bg-sky-300'
                                : 'bg-white'
                    }`}
                    style={{
                        left: `${cell.xPercent}%`,
                        top: `${cell.yPercent}%`,
                        width: `${cell.widthPercent}%`,
                        height: `${cell.heightPercent}%`,
                        borderLeftWidth: cell.column === 0 ? 0 : 2,
                        borderTopWidth: cell.row === 0 ? 0 : 1
                    }}
                />
            ))}
        </div>
        <div className="mt-2 text-center text-xs font-bold text-slate-500">
            {model.rows} × {model.columns} grid · {model.partCount} equal parts
        </div>
        {model.groups.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
                {model.groups.map(group => (
                    <span
                        key={`${group.source}-${group.startCell}`}
                        className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                            group.source === 'first-addend'
                                ? 'border-sky-600 bg-sky-100 text-sky-950'
                                : 'border-amber-600 bg-amber-100 text-amber-950'
                        }`}
                    >
                        {group.source === 'first-addend' ? 'First addend: ' : 'Second addend: '}
                        {group.label}
                    </span>
                ))}
            </div>
        )}
    </div>
);
