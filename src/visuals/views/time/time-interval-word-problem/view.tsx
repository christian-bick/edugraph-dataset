import {Scope} from 'edugraph-ts';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {getClockAngles, getTickMarks} from '../time-analog/helpers.ts';
import {
    TimeIntervalWordProblemViewConfig,
    TimeIntervalWordProblemViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: TimeIntervalWordProblemViewConfig;
    payload: ViewRenderPayload<'time-interval-word-problem'>;
}

const parseTime = (time: string): {hour: number; minute: number} => {
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    if (!match) throw new ViewValidationError('time-interval-word-problem', `Invalid time: ${time}`);
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 1 || hour > 10 || minute < 0 || minute > 59) {
        throw new ViewValidationError('time-interval-word-problem', `Unsupported time: ${time}`);
    }
    return {hour, minute};
};

const displayTime = (time: string): string => {
    const {hour, minute} = parseTime(time);
    return `${hour}:${String(minute).padStart(2, '0')}`;
};

function AnalogClock({time, label, reveal}: {time: string; label: string; reveal: boolean}) {
    const angles = getClockAngles(`${time}:00`);
    const ticks = getTickMarks();
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">{label}</div>
            <svg className="h-[132px] w-[132px]" viewBox="0 0 100 100" role="img" aria-label={`${label} analog clock`}>
                <circle cx="50" cy="50" r="45" className="fill-white stroke-slate-700 stroke-[2px]" />
                {ticks.map((tick, index) => <circle key={index} cx={tick.x} cy={tick.y} r={tick.isFive ? 1.8 : 0.8} className="fill-slate-600" />)}
                {reveal && <>
                    <line x1="50" y1="50" x2="50" y2="27" transform={`rotate(${angles.hourAngle} 50 50)`} className="stroke-slate-800 stroke-[4px]" strokeLinecap="round" />
                    <line x1="50" y1="50" x2="50" y2="15" transform={`rotate(${angles.minuteAngle} 50 50)`} className="stroke-sky-600 stroke-[3px]" strokeLinecap="round" />
                    <circle cx="50" cy="50" r="3" className="fill-slate-800" />
                </>}
            </svg>
            <div className="font-mono text-lg font-bold text-slate-800">{reveal ? displayTime(time) : '?:??'}</div>
        </div>
    );
}

function DigitalClock({time, label, reveal}: {time: string; label: string; reveal: boolean}) {
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">{label}</div>
            <div className="flex h-[120px] w-[210px] items-center justify-center rounded-2xl border-[6px] border-slate-600 bg-slate-950 font-mono text-[3rem] font-bold tracking-[0.05em] text-cyan-200">
                {reveal ? displayTime(time) : '–:––'}
            </div>
        </div>
    );
}

const TimeIntervalWordProblemCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('time-interval-word-problem', data, [
        'operation',
        'story',
        'startTime',
        'endTime',
        'elapsedMinutes',
        'referenceHour',
        'startOffsetMinutes',
        'endOffsetMinutes',
        'unknown'
    ]);

    const start = parseTime(data.startTime);
    const end = parseTime(data.endTime);
    const coherent = (data.operation === 'addition' || data.operation === 'subtraction')
        && data.referenceHour === start.hour
        && end.hour === start.hour + 1
        && data.startOffsetMinutes === start.minute
        && data.endOffsetMinutes === 60 + end.minute
        && data.endOffsetMinutes - data.startOffsetMinutes === data.elapsedMinutes
        && data.unknown === (data.operation === 'addition' ? 'end-time' : 'elapsed-minutes');
    if (!coherent) {
        throw new ViewValidationError('time-interval-word-problem', 'Time-interval values are not coherent.');
    }

    const Clock = config.clockType === Scope.AnalogClock ? AnalogClock : DigitalClock;
    const revealEnd = data.unknown !== 'end-time' || isSolutionView;
    const symbol = data.operation === 'addition' ? '+' : '−';
    const left = data.operation === 'addition' ? data.startOffsetMinutes : data.endOffsetMinutes;
    const right = data.operation === 'addition' ? data.elapsedMinutes : data.startOffsetMinutes;
    const result = data.operation === 'addition' ? data.endOffsetMinutes : data.elapsedMinutes;
    const reference = `${data.referenceHour}:00`;

    return (
        <div className="w-[780px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Time interval story</div>
            <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 text-lg font-semibold leading-relaxed text-slate-800">{data.story}</div>

            <div className="mt-5 flex items-center justify-center gap-8">
                <Clock time={data.startTime} label="Start" reveal={true} />
                <div className="rounded-lg bg-sky-50 px-4 py-3 text-center text-sky-800">
                    <div className="text-xs font-bold uppercase tracking-wide">Duration</div>
                    <div className="mt-1 text-xl font-bold">{data.unknown === 'elapsed-minutes' && !isSolutionView ? '? minutes' : `${data.elapsedMinutes} minutes`}</div>
                </div>
                <Clock time={data.endTime} label="End" reveal={revealEnd} />
            </div>

            <div className={`mt-5 rounded-xl border-2 px-5 py-4 text-center ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 text-slate-400'}`}>
                {isSolutionView ? <>
                    <div className="text-sm font-semibold">Count minutes after {reference}.</div>
                    <div className="mt-1 font-mono text-2xl font-bold">{left} {symbol} {right} = {result}</div>
                    <div className="mt-1 text-lg font-bold">Answer: {data.unknown === 'end-time' ? displayTime(data.endTime) : `${data.elapsedMinutes} minutes`}</div>
                </> : <div className="text-xl font-bold">Answer: __________</div>}
            </div>
        </div>
    );
};

export const TimeIntervalWordProblemView = withConfig(
    TimeIntervalWordProblemViewSchema,
    TimeIntervalWordProblemCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'time-interval-word-problem'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<TimeIntervalWordProblemView payload={payload} />);
    }
};
