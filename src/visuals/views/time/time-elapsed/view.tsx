import {Scope} from 'edugraph-ts';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {getClockAngles, getTickMarks} from '../time-analog/helpers.ts';
import {TimeElapsedViewConfig, TimeElapsedViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: TimeElapsedViewConfig;
    payload: ViewRenderPayload<'time-elapsed'>;
}

const parseTime = (time: string): {hour: number; minute: number} => {
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    if (!match) throw new ViewValidationError('time-elapsed', `Invalid time: ${time}`);
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 1 || hour > 11 || minute < 0 || minute > 59) {
        throw new ViewValidationError('time-elapsed', `Unsupported time: ${time}`);
    }
    return {hour, minute};
};

const displayTime = ({hour, minute}: {hour: number; minute: number}): string =>
    `${hour}:${String(minute).padStart(2, '0')}`;

function AnalogClock({time, label}: {time: string; label: string}) {
    const angles = getClockAngles(`${time}:00`);
    const ticks = getTickMarks();
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</div>
            <svg className="h-[172px] w-[172px]" viewBox="0 0 100 100" role="img" aria-label={`${label} analog clock showing ${time}`}>
                <circle cx="50" cy="50" r="45" className="fill-white stroke-slate-700 stroke-[2px]" />
                {ticks.map((tick, index) => <circle key={index} cx={tick.x} cy={tick.y} r={tick.isFive ? 1.8 : 0.8} className="fill-slate-600" />)}
                <line x1="50" y1="50" x2="50" y2="27" transform={`rotate(${angles.hourAngle} 50 50)`} className="stroke-slate-800 stroke-[4px]" strokeLinecap="round" />
                <line x1="50" y1="50" x2="50" y2="15" transform={`rotate(${angles.minuteAngle} 50 50)`} className="stroke-sky-600 stroke-[3px]" strokeLinecap="round" />
                <circle cx="50" cy="50" r="3" className="fill-slate-800" />
            </svg>
            <div className="font-mono text-xl font-bold text-slate-800">{displayTime(parseTime(time))}</div>
        </div>
    );
}

function DigitalClock({time, label}: {time: string; label: string}) {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</div>
            <div className="flex h-[150px] w-[245px] items-center justify-center rounded-2xl border-[6px] border-slate-600 bg-slate-950 font-mono text-[3.6rem] font-bold tracking-[0.06em] text-cyan-200 shadow-[inset_0_0_18px_rgba(34,211,238,0.12)]">
                {displayTime(parseTime(time))}
            </div>
        </div>
    );
}

const TimeElapsedCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('time-elapsed', data, [
        'startTime',
        'endTime',
        'elapsedMinutes',
        'minutesToNextHour',
        'minutesAfterHour',
        'crossesHour'
    ]);

    const start = parseTime(data.startTime);
    const end = parseTime(data.endTime);
    const startTotal = start.hour * 60 + start.minute;
    const endTotal = end.hour * 60 + end.minute;
    const coherent = data.crossesHour === true
        && end.hour === start.hour + 1
        && data.minutesToNextHour === 60 - start.minute
        && data.minutesAfterHour === end.minute
        && data.elapsedMinutes === endTotal - startTotal
        && data.elapsedMinutes === data.minutesToNextHour + data.minutesAfterHour;
    if (!coherent) {
        throw new ViewValidationError('time-elapsed', 'Elapsed-time values are not coherent.');
    }

    const Clock = config.clockType === Scope.AnalogClock ? AnalogClock : DigitalClock;
    const nextHour = `${end.hour}:00`;

    return (
        <div className="w-[760px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">Measure elapsed time</div>
            <div className="mt-1 text-[1.35rem] font-bold text-slate-800">How many minutes pass from start to end?</div>

            <div className="mt-5 flex items-center justify-center gap-12">
                <Clock time={data.startTime} label="Start" />
                <div className="text-4xl font-light text-slate-300">→</div>
                <Clock time={data.endTime} label="End" />
            </div>

            {isSolutionView ? (
                <div className="mt-5 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 text-center text-emerald-900">
                    <div className="text-base font-semibold">
                        {displayTime(start)} → {nextHour}: {data.minutesToNextHour} min&nbsp;&nbsp; + &nbsp;&nbsp;
                        {nextHour} → {displayTime(end)}: {data.minutesAfterHour} min
                    </div>
                    <div className="mt-2 font-mono text-2xl font-bold">
                        {data.minutesToNextHour} + {data.minutesAfterHour} = {data.elapsedMinutes} minutes
                    </div>
                </div>
            ) : (
                <div className="mt-5 rounded-xl border-2 border-dashed border-slate-300 px-5 py-5 text-center text-xl font-bold text-slate-400">
                    Elapsed time: ____ minutes
                </div>
            )}
        </div>
    );
};

export const TimeElapsed = withConfig(TimeElapsedViewSchema, TimeElapsedCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'time-elapsed'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<TimeElapsed payload={payload} />);
    }
};
