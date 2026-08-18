import {createRoot} from 'react-dom/client';
import {Ability} from 'edugraph-ts';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {TimeDigitalViewConfig, TimeDigitalViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: TimeDigitalViewConfig;
    payload: ViewRenderPayload<'time-digital'>;
}

interface DigitalTimeParts {
    hour: string;
    minute: string;
    second?: string;
}

function parseDigitalTime(time: string, interval: number): DigitalTimeParts {
    const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(time);
    if (!match) {
        throw new ViewValidationError('time-digital', `Invalid time: ${time}`);
    }

    const [, hourText, minuteText, secondText] = match;
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const second = Number(secondText);
    if (hour > 23 || minute > 59 || second > 59 || interval <= 0) {
        throw new ViewValidationError('time-digital', `Invalid time data: ${time}, interval ${interval}`);
    }

    const normalizedHour = hour % 12;
    const hour12 = normalizedHour === 0 ? 12 : normalizedHour;
    return {
        hour: String(hour12),
        minute: minuteText,
        ...(interval < 60 ? {second: secondText} : {})
    };
}

function formatDigitalTime(parts: DigitalTimeParts): string {
    const base = `${parts.hour}:${parts.minute}`;
    return parts.second === undefined ? base : `${base}:${parts.second}`;
}

function DigitalDisplay({value, period, highlighted = false}: {value: string; period?: 'a.m.' | 'p.m.'; highlighted?: boolean}) {
    const displayClass = highlighted
        ? 'text-emerald-300 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.15),0_0_16px_rgba(16,185,129,0.2)]'
        : 'text-cyan-200 border-slate-500 shadow-[inset_0_0_20px_rgba(34,211,238,0.08)]';

    return (
        <div className={`relative flex h-[132px] w-[310px] items-center justify-center rounded-2xl border-[6px] bg-slate-950 ${displayClass}`}>
            <div className="absolute inset-[8px] rounded-lg border border-slate-700/70" />
            <div className="relative font-mono text-[4.6rem] font-bold leading-none tracking-[0.08em] tabular-nums">
                {value}
            </div>
            <div className="absolute right-4 top-3 text-[0.65rem] tracking-[0.2em] text-slate-500">DIGITAL</div>
            {period !== undefined && (
                <div className="absolute bottom-3 right-4 rounded bg-slate-800 px-2 py-1 font-sans text-[0.82rem] font-bold tracking-wide text-cyan-100">
                    {period}
                </div>
            )}
        </div>
    );
}

function numberToWords(value: number): string {
    const small = [
        'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
        'seventeen', 'eighteen', 'nineteen'
    ];
    if (value < 20) return small[value];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
    const remainder = value % 10;
    return remainder === 0 ? tens[Math.floor(value / 10)] : `${tens[Math.floor(value / 10)]}-${small[remainder]}`;
}

function formatTimeClue(parts: DigitalTimeParts): string {
    const hour = Number(parts.hour);
    const minute = Number(parts.minute);
    if (parts.second !== undefined) {
        return `${numberToWords(hour)} hours, ${numberToWords(minute)} minutes, and ${numberToWords(Number(parts.second))} seconds`;
    }
    if (minute === 0) return `${numberToWords(hour)} o'clock`;
    if (minute === 30) return `half past ${numberToWords(hour)}`;
    return `${numberToWords(minute)} minutes past ${numberToWords(hour)}`;
}

const TimeDigitalCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('time-digital', data, ['time', 'interval']);
    if (data.period !== undefined && data.period !== 'a.m.' && data.period !== 'p.m.') {
        throw new ViewValidationError('time-digital', `Unsupported day period: ${data.period}`);
    }

    const timeParts = parseDigitalTime(data.time, data.interval);
    const formattedTime = formatDigitalTime(timeParts);
    const timeClue = formatTimeClue(timeParts);
    const displayValue = isSolutionView ? formattedTime : formattedTime.replace(/\d/g, '–');
    const prompt = config.taskAbilities!.includes(Ability.Formalization)
        || config.taskAbilities!.includes(Ability.VisualArticulation)
        ? 'Build the digital time.'
        : 'Set the digital clock.';

    return (
        <div className="flex w-full items-center justify-center bg-white p-6 font-sans">
            <div className="flex w-[520px] flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-slate-50 px-8 py-7 shadow-sm">
                <div className="flex min-h-[32px] items-center justify-center text-center text-[1.35rem] font-bold leading-snug text-slate-700">
                    {prompt}
                </div>

                <div className="flex min-h-[86px] min-w-[300px] items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-6 text-center text-[1.4rem] font-bold text-slate-800">
                    {timeClue}
                </div>

                <DigitalDisplay value={displayValue} period={data.period} highlighted={isSolutionView} />
            </div>
        </div>
    );
};

export const TimeDigital = withConfig(TimeDigitalViewSchema, TimeDigitalCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'time-digital'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<TimeDigital payload={payload} />);
    }
};
