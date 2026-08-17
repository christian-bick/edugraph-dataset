import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {Grade4FractionLinePlotProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {formatMeasurement, formatMeasurementValue, validateMeasurementData} from '../helpers.ts';
import {
    isGrade4FractionLinePlotProblem,
    isMeasurementLinePlotTaskConfigCompatible,
    isValidGrade4FractionLinePlotProblem
} from './helpers.ts';
import {MeasurementLinePlotViewConfig, MeasurementLinePlotViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasurementLinePlotViewConfig;
    payload: ViewRenderPayload<'measurement-line-plot'>;
}

function FractionalPlot({
    data,
    showMarks
}: {
    data: Grade4FractionLinePlotProblem;
    showMarks: boolean;
}) {
    return (
        <div
            className="rounded-xl border border-slate-200 bg-slate-50 px-6 pb-5 pt-5"
            aria-label={`${showMarks ? 'Completed' : 'Empty'} fractional line plot with 17 one-eighth-inch ticks`}
        >
            <div className="grid items-end" style={{gridTemplateColumns: `repeat(${data.axisTicks.length}, minmax(0, 1fr))`}}>
                {data.axisTicks.map((tick, index) => (
                    <div key={tick.index} className="flex h-[140px] min-w-0 flex-col items-center justify-end">
                        <div className="flex min-h-[76px] flex-col-reverse items-center text-[1.45rem] font-black leading-[1.35rem] text-violet-600" aria-hidden="true">
                            {showMarks && Array.from({length: data.frequencies[index]!.count}, (_, mark) => (
                                <span key={mark}>×</span>
                            ))}
                        </div>
                        <div className="mt-1 h-3 w-px bg-slate-600" />
                    </div>
                ))}
            </div>
            <div className="h-[2px] bg-slate-700" />
            <div className="grid" style={{gridTemplateColumns: `repeat(${data.axisTicks.length}, minmax(0, 1fr))`}}>
                {data.axisTicks.map(tick => (
                    <div key={tick.index} className="min-w-0 pt-2 text-center font-mono text-[9px] font-bold text-slate-700">
                        {tick.value.display}
                    </div>
                ))}
            </div>
            <div className="mt-3 text-center text-xs font-bold text-slate-600">
                {data.scaleStatement}
            </div>
            <div className="mt-1 text-center text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">
                Length (inches)
            </div>
        </div>
    );
}

function Grade4FractionLinePlotTask({
    data,
    isSolutionView
}: {
    data: Grade4FractionLinePlotProblem;
    isSolutionView: boolean;
}) {
    const isConstruction = data.task === 'construct-fraction-line-plot';
    const showMarks = !isConstruction || isSolutionView;
    return (
        <div className="w-[760px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Fractional length data</div>
            <div className="mt-1 text-xl font-bold leading-snug text-slate-800">{data.prompt}</div>
            {isConstruction && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {data.fractionObservations.map(({object, value}) => (
                        <div key={object} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold capitalize text-slate-700">
                            {object}: <span className="font-mono font-extrabold">{value.quantityText}</span>
                        </div>
                    ))}
                </div>
            )}
            <div className={isConstruction ? 'mt-5' : 'mt-6'}>
                <FractionalPlot data={data} showMarks={showMarks} />
            </div>
            {!isConstruction && (
                <div className={`mt-4 rounded-xl border-2 px-5 py-3 text-center font-mono text-[1.05rem] font-extrabold ${
                    isSolutionView
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-300 bg-white text-slate-700'
                }`}>
                    {isSolutionView ? data.solutionEquation : data.questionEquation}
                </div>
            )}
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="text-[1.02rem] font-extrabold">{data.answerStatement}</div>
                    <div className="mt-2 text-[0.92rem] font-semibold leading-snug text-slate-700">{data.explanation}</div>
                </div>
            )}
        </div>
    );
}

const MeasurementLinePlotCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('measurement-line-plot', data, ['unit', 'subdivisions', 'observations']);
    if (isGrade4FractionLinePlotProblem(data)) {
        validateProblemData('measurement-line-plot', data, [
            'task',
            'fractionObservations',
            'axisStart',
            'axisEnd',
            'interval',
            'axisTicks',
            'frequencies',
            'scaleStatement',
            'prompt',
            'answerStatement',
            'explanation'
        ]);
        if (data.task === 'fraction-line-plot-arithmetic') {
            validateProblemData('measurement-line-plot', data, [
                'operation',
                'shortest',
                'longest',
                'leftOperand',
                'rightOperand',
                'answer',
                'questionEquation',
                'solutionEquation'
            ]);
        }
        if (!isValidGrade4FractionLinePlotProblem(data)
            || !isMeasurementLinePlotTaskConfigCompatible(data, config)) {
            throw new ViewValidationError(
                'measurement-line-plot',
                'The fractional observations, axis, frequencies, task mode, and supplied arithmetic must be consistent.'
            );
        }
        return <Grade4FractionLinePlotTask data={data} isSolutionView={isSolutionView} />;
    }
    validateMeasurementData(data, 'measurement-line-plot');
    if (config.usesUnitSteps && data.subdivisions !== 1) {
        throw new ViewValidationError('measurement-line-plot', 'Unit-step line plots require whole-unit subdivisions.');
    }

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
                    : config.executeProcedure
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
