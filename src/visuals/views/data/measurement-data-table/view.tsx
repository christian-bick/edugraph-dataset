import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {MeasurementDataProblem, MeasurementObservation} from '../../../../types/problems.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {formatMeasurement, validateMeasurementData} from '../helpers.ts';
import {MeasurementDataTableViewConfig, MeasurementDataTableViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasurementDataTableViewConfig;
    payload: ViewRenderPayload<'measurement-data-table'>;
}

function MeasurementRow({observation, data, reveal}: {observation: MeasurementObservation; data: MeasurementDataProblem; reveal: boolean}) {
    const width = observation.length * 28;
    const maxLength = data.unit === 'cm' ? 10 : 8;
    const tickCount = maxLength * data.subdivisions;
    return (
        <div className="grid grid-cols-[90px_1fr_92px] items-center gap-4 border-t border-slate-200 py-3 first:border-t-0">
            <div className="text-base font-bold capitalize text-slate-700">{observation.object}</div>
            <div className="relative h-[54px]">
                <div
                    className="absolute left-0 top-1 h-5 rounded-full border-2 border-sky-600 bg-sky-100"
                    style={{width}}
                />
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
                {reveal ? formatMeasurement(observation.length, data.unit) : `? ${data.unit}`}
            </div>
        </div>
    );
}

const MeasurementDataTableCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateMeasurementData(data, 'measurement-data-table');
    if (config.useInchScale && data.unit !== 'in') {
        throw new ViewValidationError(
            'measurement-data-table',
            'An inch-scale measurement table requires inch observations.'
        );
    }

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
