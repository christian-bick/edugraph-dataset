import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {MeasurementDataProblem, MeasurementExtremaRelation} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {formatMeasurement} from './helpers.ts';
import {
    buildMeasurementLinePlot,
    MeasurementLinePlotModel,
    validateMeasurementExtremaRelation
} from './measurement-line-plot-helpers.ts';

export type MeasurementLinePlotMode = 'construction' | 'arithmetic';

interface MeasurementLinePlotViewProps {
    mode: MeasurementLinePlotMode;
    payload: RenderPayload<AbstractProblem<MeasurementDataProblem>>;
    requireUnitSteps?: boolean;
    viewId: string;
}

const stepText = (subdivisions: MeasurementDataProblem['subdivisions']): string =>
    subdivisions === 1 ? '1' : subdivisions === 4 ? '¼' : '⅛';

const LinePlot = ({
    data,
    model,
    showMarks,
    solutionMarks
}: {
    data: MeasurementDataProblem;
    model: MeasurementLinePlotModel;
    showMarks: boolean;
    solutionMarks: boolean;
}) => (
    <div
        className="rounded-xl border border-slate-200 bg-slate-50 px-6 pb-5 pt-5"
        aria-label={`${showMarks ? 'Completed' : 'Empty'} line plot with ${model.ticks.length} ticks`}
    >
        <div className="grid items-end" style={{gridTemplateColumns: `repeat(${model.ticks.length}, minmax(0, 1fr))`}}>
            {model.ticks.map(tick => (
                <div key={tick.value} className="flex h-[140px] min-w-0 flex-col items-center justify-end">
                    <div className={`flex min-h-[76px] flex-col-reverse items-center text-[1.45rem] font-black leading-[1.35rem] ${solutionMarks ? 'text-emerald-600' : 'text-violet-600'}`} aria-hidden="true">
                        {showMarks && Array.from({length: tick.count}, (_, mark) => <span key={mark}>×</span>)}
                    </div>
                    <div className="mt-1 h-3 w-px bg-slate-600" />
                </div>
            ))}
        </div>
        <div className="h-[2px] bg-slate-700" />
        <div className="grid" style={{gridTemplateColumns: `repeat(${model.ticks.length}, minmax(0, 1fr))`}}>
            {model.ticks.map(tick => (
                <div key={tick.value} className={`min-w-0 pt-2 text-center font-mono font-bold text-slate-700 ${model.ticks.length > 12 ? 'text-[9px]' : 'text-sm'}`}>
                    {tick.display}
                </div>
            ))}
        </div>
        <div className="mt-3 text-center text-xs font-bold text-slate-600">
            Each tick mark represents {stepText(data.subdivisions)} {data.unit === 'cm' ? 'centimeter' : 'inch'}.
        </div>
        <div className="mt-1 text-center text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">
            Length ({data.unit})
        </div>
    </div>
);

const arithmeticPrompt = (relation: MeasurementExtremaRelation): string => relation.operation === 'addition'
    ? 'What is the combined length of the shortest and longest measurements?'
    : 'How much longer is the longest measurement than the shortest measurement?';

const questionEquation = (relation: MeasurementExtremaRelation): string => relation.operation === 'addition'
    ? 'shortest + longest = ?'
    : 'longest − shortest = ?';

const solutionEquation = (relation: MeasurementExtremaRelation, data: MeasurementDataProblem): string =>
    `${formatMeasurement(relation.leftOperand, data.unit)} ${relation.operation === 'addition' ? '+' : '−'} ${formatMeasurement(relation.rightOperand, data.unit)} = ${formatMeasurement(relation.answer, data.unit)}`;

const explanation = (relation: MeasurementExtremaRelation, data: MeasurementDataProblem): string => relation.operation === 'addition'
    ? `The shortest measurement is ${formatMeasurement(relation.shortest, data.unit)}, and the longest is ${formatMeasurement(relation.longest, data.unit)}. Add them to get ${formatMeasurement(relation.answer, data.unit)}.`
    : `The longest measurement is ${formatMeasurement(relation.longest, data.unit)}, and the shortest is ${formatMeasurement(relation.shortest, data.unit)}. Subtract to get ${formatMeasurement(relation.answer, data.unit)}.`;

export const MeasurementLinePlotView = ({
    mode,
    payload,
    requireUnitSteps = false,
    viewId
}: MeasurementLinePlotViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    const model = buildMeasurementLinePlot(data, viewId);
    if (requireUnitSteps && data.subdivisions !== 1) {
        throw new ViewValidationError(viewId, 'Unit-step line plots require whole-unit measurements.');
    }
    const relation = validateMeasurementExtremaRelation(data, viewId, mode === 'arithmetic');
    const showMarks = mode === 'arithmetic' || isSolutionView;

    return (
        <div data-line-plot-mode={mode} className="w-[760px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Recorded length data</div>
            <div className="mt-1 text-xl font-bold leading-snug text-slate-800">
                {mode === 'construction'
                    ? isSolutionView ? 'Completed line plot' : 'Plot each recorded measurement on the line plot.'
                    : arithmeticPrompt(relation!)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                {data.observations.map(({object, value}) => (
                    <div key={object} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold capitalize text-slate-700">
                        {object}: <span className="font-mono font-extrabold">{formatMeasurement(value, data.unit)}</span>
                    </div>
                ))}
            </div>
            <div className="mt-5">
                <LinePlot
                    data={data}
                    model={model}
                    showMarks={showMarks}
                    solutionMarks={mode === 'construction' && isSolutionView}
                />
            </div>
            {mode === 'arithmetic' && relation && (
                <>
                    <div className={`mt-4 rounded-xl border-2 px-5 py-3 text-center font-mono text-[1.05rem] font-extrabold ${
                        isSolutionView
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                            : 'border-slate-300 bg-white text-slate-700'
                    }`}>
                        {isSolutionView ? solutionEquation(relation, data) : questionEquation(relation)}
                    </div>
                    {isSolutionView && (
                        <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                            <div className="text-[1.02rem] font-extrabold">
                                {relation.operation === 'addition' ? 'The combined length' : 'The difference'} is {formatMeasurement(relation.answer, data.unit)}.
                            </div>
                            <div className="mt-2 text-[0.92rem] font-semibold leading-snug text-slate-700">
                                {explanation(relation, data)}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
