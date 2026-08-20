import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {MeasurementDataProblem, MeasurementObservation} from '../../../../types/problems.ts';
import {withConfig} from '../../withConfig.tsx';
import {formatMeasurement, validateMeasurementData} from '../helpers.ts';
import {MeasurementDataTableViewConfig, MeasurementDataTableViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasurementDataTableViewConfig;
    payload: ViewRenderPayload<'measurement-data-table'>;
}

function MeasurementObject({object, width}: {object: MeasurementObservation['object']; width: number}) {
    const common = {
        width,
        height: 22,
        viewBox: '0 0 100 22',
        preserveAspectRatio: 'none' as const,
        'aria-label': `${object} to measure`
    };
    if (object === 'pencil') return (
        <svg {...common}><rect x="1" y="5" width="88" height="12" rx="2" fill="#facc15" stroke="#a16207"/><polygon points="89,5 100,11 89,17" fill="#f5deb3" stroke="#92400e"/><path d="M96 9 L100 11 L96 13 Z" fill="#334155"/></svg>
    );
    if (object === 'crayon') return (
        <svg {...common}><rect x="1" y="4" width="92" height="14" rx="4" fill="#a855f7" stroke="#6b21a8"/><polygon points="93,4 100,11 93,18" fill="#7e22ce"/><rect x="20" y="4" width="5" height="14" fill="#f3e8ff" opacity="0.8"/></svg>
    );
    if (object === 'ribbon') return (
        <svg {...common}><path d="M1 11 C16 1, 29 21, 45 11 S74 1, 99 11" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round"/><path d="M1 11 C16 1, 29 21, 45 11 S74 1, 99 11" fill="none" stroke="#fecaca" strokeWidth="2"/></svg>
    );
    if (object === 'key') return (
        <svg {...common}><circle cx="12" cy="11" r="9" fill="#cbd5e1" stroke="#475569" strokeWidth="2"/><circle cx="12" cy="11" r="4" fill="white" stroke="#64748b"/><rect x="20" y="8" width="76" height="6" rx="2" fill="#94a3b8" stroke="#475569"/><path d="M78 14 V20 H86 V14 M90 14 V18 H98 V12" fill="none" stroke="#475569" strokeWidth="3"/></svg>
    );
    if (object === 'brush') return (
        <svg {...common}><rect x="1" y="7" width="75" height="8" rx="4" fill="#a16207" stroke="#713f12"/><rect x="74" y="5" width="10" height="12" fill="#94a3b8" stroke="#475569"/><path d="M84 4 L100 7 L100 15 L84 18 Z" fill="#38bdf8" stroke="#0369a1"/></svg>
    );
    return (
        <svg {...common}><rect x="1" y="2" width="98" height="18" rx="3" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="2"/><path d="M8 7 H92 M8 12 H92 M8 17 H92" stroke="#bfdbfe" strokeWidth="1"/></svg>
    );
}

function MeasurementRow({observation, data, reveal}: {observation: MeasurementObservation; data: MeasurementDataProblem; reveal: boolean}) {
    const width = observation.value * 28;
    const maxLength = data.unit === 'cm' ? 10 : 8;
    const tickCount = maxLength * data.subdivisions;
    return (
        <div className="grid grid-cols-[90px_1fr_92px] items-center gap-4 border-t border-slate-200 py-3 first:border-t-0">
            <div className="text-base font-bold capitalize text-slate-700">{observation.object}</div>
            <div className="relative h-[54px]">
                <div className="absolute left-0 top-1"><MeasurementObject object={observation.object} width={width} /></div>
                <div className="absolute bottom-4 left-0 flex">
                    {Array.from({length: tickCount + 1}, (_, tick) => (
                        <div
                            key={tick}
                            className={`relative border-l border-slate-500 ${tick % data.subdivisions === 0 ? 'h-6' : tick % 2 === 0 ? 'mt-2 h-4' : 'mt-3 h-3'}`}
                            style={{width: tick === tickCount ? 0 : 28 / data.subdivisions}}
                        >
                            {tick % data.subdivisions === 0 && <span className="absolute left-0 top-6 -translate-x-1/2 text-[10px] font-semibold text-slate-500">{tick / data.subdivisions}</span>}
                        </div>
                    ))}
                    <span className="ml-2 mt-6 text-[10px] font-bold text-slate-500">{data.unit}</span>
                </div>
            </div>
            <div className={`flex h-11 items-center justify-center rounded-lg border-2 font-mono text-lg font-extrabold ${
                reveal
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-dashed border-slate-400 bg-white text-slate-400'
            }`}>
                {reveal ? formatMeasurement(observation.value, data.unit) : `? ${data.unit}`}
            </div>
        </div>
    );
}

const MeasurementDataTableCore = ({payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateMeasurementData(data, 'measurement-data-table');
    return (
        <div className="w-[690px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">Collect length data</div>
            <div className="mt-1 text-xl font-bold text-slate-800">
                {isSolutionView
                    ? 'Recorded measurements'
                    : `Measure each object to the nearest ${data.unit === 'cm' ? 'centimeter' : 'quarter inch'}.`}
            </div>
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-5">
                {data.observations.map(observation => (
                    <MeasurementRow key={observation.object} observation={observation} data={data} reveal={isSolutionView} />
                ))}
            </div>
        </div>
    );
};

export const MeasurementDataTable = withConfig(MeasurementDataTableViewSchema, MeasurementDataTableCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measurement-data-table'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasurementDataTable payload={payload} />);
};
