import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {TimeDigitalViewConfig, TimeDigitalViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: TimeDigitalViewConfig;
    payload: ViewRenderPayload<'time-digital'>;
}

function formatDigitalTime(time: string, interval: number): string {
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
    const base = `${hour12}:${minuteText}`;
    return interval < 60 ? `${base}:${secondText}` : base;
}

function DigitalDisplay({value, highlighted = false}: {value: string; highlighted?: boolean}) {
    const displayClass = highlighted
        ? 'text-emerald-300 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.15),0_0_16px_rgba(16,185,129,0.2)]'
        : 'text-cyan-200 border-slate-500 shadow-[inset_0_0_20px_rgba(34,211,238,0.08)]';

    return (
        <div className={`relative flex items-center justify-center w-[310px] h-[132px] rounded-2xl border-[6px] bg-slate-950 ${displayClass}`}>
            <div className="absolute inset-[8px] rounded-lg border border-slate-700/70" />
            <div className="relative font-mono text-[4.6rem] font-bold tracking-[0.08em] tabular-nums leading-none">
                {value}
            </div>
            <div className="absolute right-4 top-3 text-[0.65rem] tracking-[0.2em] text-slate-500">DIGITAL</div>
        </div>
    );
}

const TimeDigitalCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('time-digital', data, ['time', 'interval']);

    const formattedTime = formatDigitalTime(data.time, data.interval);
    const isReverse = config.isReverse;
    const displayValue = isReverse && !isSolutionView
        ? formattedTime.replace(/\d/g, '–')
        : formattedTime;

    return (
        <div className="flex w-full items-center justify-center bg-white p-6 font-sans">
            <div className="flex w-[520px] flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-slate-50 px-8 py-7 shadow-sm">
                <div className="flex min-h-[32px] items-center justify-center text-center text-[1.35rem] font-bold leading-snug text-slate-700">
                    {!isSolutionView && (
                        isReverse ? `Set the digital clock to ${formattedTime}.` : 'Write the time shown.'
                    )}
                </div>

                <DigitalDisplay value={displayValue} highlighted={isReverse && isSolutionView} />

                {!isReverse && (
                    <div className={`flex min-h-[64px] min-w-[190px] items-center justify-center rounded-xl border-2 px-5 font-mono text-[2.2rem] font-bold tabular-nums ${
                        isSolutionView
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-dashed border-slate-400 bg-white text-transparent'
                    }`}>
                        {formattedTime}
                    </div>
                )}
            </div>
        </div>
    );
};

export const TimeDigital = withConfig(TimeDigitalViewSchema, TimeDigitalCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'time-digital'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<TimeDigital payload={payload} />);
    }
};
