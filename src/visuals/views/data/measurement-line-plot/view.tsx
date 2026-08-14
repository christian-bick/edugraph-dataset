import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {formatMeasurement, formatMeasurementValue, validateMeasurementData} from '../helpers.ts';
import {MeasurementLinePlotViewConfig, MeasurementLinePlotViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasurementLinePlotViewConfig;
    payload: ViewRenderPayload<'measurement-line-plot'>;
}

const MeasurementLinePlotCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateMeasurementData(data, 'measurement-line-plot');

    const frequencies = new Map<number, number>();
    for (const {length} of data.observations) frequencies.set(length, (frequencies.get(length) ?? 0) + 1);
    const start = 2 * data.subdivisions;
    const end = (data.unit === 'cm' ? 10 : 8) * data.subdivisions;
    const axisValues = Array.from({length: end - start + 1}, (_, index) => (start + index) / data.subdivisions);

    return (
        <div className="w-[720px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Length data</div>
            <div className="mt-1 text-xl font-bold text-slate-800">
                {isSolutionView
                    ? 'Completed line plot'
                    : config.plotCollectedMeasurements
                        ? 'Plot the measurements you collected on the line plot.'
                        : 'Plot each measurement on the line plot.'}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
                {data.observations.map(({object, length}) => (
                    <div key={object} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold capitalize text-slate-700">
                        {object}: <span className="font-mono font-extrabold">{formatMeasurement(length, data.unit)}</span>
                    </div>
                ))}
            </div>
            <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 px-7 pb-5 pt-7">
                <div className="grid items-end" style={{gridTemplateColumns: `repeat(${axisValues.length}, minmax(0, 1fr))`}}>
                    {axisValues.map(value => (
                        <div key={value} className="flex h-[170px] flex-col items-center justify-end">
                            <div className="flex flex-col-reverse items-center gap-0 text-[1.55rem] font-black leading-6 text-violet-600">
                                {isSolutionView && Array.from({length: frequencies.get(value) ?? 0}, (_, mark) => (
                                    <span key={mark}>×</span>
                                ))}
                            </div>
                            <div className="mt-2 h-3 w-px bg-slate-600" />
                        </div>
                    ))}
                </div>
                <div className="h-[2px] bg-slate-700" />
                <div className="grid" style={{gridTemplateColumns: `repeat(${axisValues.length}, minmax(0, 1fr))`}}>
                    {axisValues.map(value => (
                        <div key={value} className={`pt-2 text-center font-mono font-bold text-slate-700 ${data.subdivisions === 4 ? 'text-[9px]' : 'text-sm'}`}>{formatMeasurementValue(value, data.unit)}</div>
                    ))}
                </div>
                <div className="mt-2 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Length ({data.unit}) · scale steps by {data.subdivisions === 1 ? '1' : '¼'}</div>
            </div>
        </div>
    );
};

export const MeasurementLinePlot = withConfig(MeasurementLinePlotViewSchema, MeasurementLinePlotCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measurement-line-plot'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasurementLinePlot payload={payload} />);
};
