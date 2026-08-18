import {DecimalPlaceValueColumn, DecimalScaleTick} from '../../../types/problems.ts';
import {pointLabelTransform} from './decimal-notation-helpers.ts';

export const PlaceValueTable = ({
    columns,
    revealDigits,
    showUnitFractions,
    ariaLabel
}: {
    columns: [DecimalPlaceValueColumn, DecimalPlaceValueColumn, DecimalPlaceValueColumn];
    revealDigits: boolean;
    showUnitFractions: boolean;
    ariaLabel: string;
}) => (
    <div className="overflow-hidden rounded-xl border-2 border-slate-300 bg-white" role="img" aria-label={ariaLabel}>
        <div className="grid grid-cols-3 bg-slate-100 text-center text-xs font-extrabold uppercase tracking-wide text-slate-600">
            {columns.map(column => (
                <div key={column.place} className="border-r border-slate-300 px-3 py-2 last:border-r-0">
                    {column.place}
                </div>
            ))}
        </div>
        <div className="grid grid-cols-3 text-center">
            {columns.map(column => (
                <div key={column.place} className="border-r border-t border-slate-300 px-3 py-3 last:border-r-0">
                    <div className="font-mono text-2xl font-black text-slate-900">
                        {revealDigits ? column.digit : '?'}
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-500">
                        {showUnitFractions ? `place value ${column.unitFraction}` : 'decimal digit'}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const DecimalScale = ({
    ticks,
    ariaLabel,
    marker,
    measuredSegment,
    unitSymbol,
    showInteriorLabels
}: {
    ticks: DecimalScaleTick[];
    ariaLabel: string;
    marker: {xPercent: number; label: string | null} | null;
    measuredSegment: {xPercent: number} | null;
    unitSymbol: 'm' | null;
    showInteriorLabels: boolean;
}) => (
    <div className="rounded-2xl border-2 border-slate-200 bg-white px-8 pb-6 pt-5" role="img" aria-label={ariaLabel}>
        <div className="relative mx-auto h-[150px] w-[800px]" aria-hidden="true">
            {measuredSegment !== null && (
                <div
                    className="absolute left-0 top-[61px] h-[14px] rounded-l-full bg-sky-300"
                    style={{width: `${measuredSegment.xPercent}%`}}
                />
            )}
            <div className="absolute left-0 right-0 top-[68px] h-[4px] rounded-full bg-slate-800" />
            {ticks.map(tick => {
                const height = tick.kind === 'endpoint' ? 34 : tick.kind === 'major' ? 26 : 14;
                return (
                    <div key={tick.index}>
                        <div
                            className="absolute top-[54px] w-px bg-slate-700"
                            style={{
                                left: `${tick.xPercent}%`,
                                height,
                                transform: 'translateX(-50%)'
                            }}
                        />
                        {tick.label !== ''
                            && (showInteriorLabels || tick.kind === 'endpoint') && (
                            <div
                                className="absolute top-[94px] whitespace-nowrap font-mono text-xs font-bold text-slate-600"
                                style={{
                                    left: `${tick.xPercent}%`,
                                    transform: pointLabelTransform(tick.xPercent)
                                }}
                            >
                                {tick.label}{unitSymbol === null ? '' : ` ${unitSymbol}`}
                            </div>
                        )}
                    </div>
                );
            })}
            {marker !== null && (
                <>
                    <div
                        className="absolute top-[36px] h-[34px] w-[3px] bg-rose-600"
                        style={{left: `${marker.xPercent}%`, transform: 'translateX(-50%)'}}
                    />
                    <div
                        className="absolute top-[28px] h-4 w-4 rounded-full border-[3px] border-white bg-rose-600 shadow"
                        style={{left: `${marker.xPercent}%`, transform: 'translateX(-50%)'}}
                    />
                    {marker.label !== null && (
                        <div
                            className="absolute top-0 whitespace-nowrap rounded-full bg-rose-50 px-3 py-1 font-mono text-sm font-black text-rose-800"
                            style={{
                                left: `${marker.xPercent}%`,
                                transform: pointLabelTransform(marker.xPercent)
                            }}
                        >
                            {marker.label}
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
);
