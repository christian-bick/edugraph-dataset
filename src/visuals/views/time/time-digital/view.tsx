import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {formatDigitalTime, formatTimeClue, validateDigitalTimeProblem} from './helpers.ts';
import {TimeDigitalViewConfig, TimeDigitalViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: TimeDigitalViewConfig;
    payload: ViewRenderPayload<'time-digital'>;
}

function DigitalDisplay({value, period, highlighted}: {
    value: string;
    period?: 'a.m.' | 'p.m.';
    highlighted: boolean;
}) {
    const displayClass = highlighted
        ? 'text-emerald-300 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.15),0_0_16px_rgba(16,185,129,0.2)]'
        : 'text-cyan-200 border-slate-500 shadow-[inset_0_0_20px_rgba(34,211,238,0.08)]';
    return (
        <div aria-label={`Digital display: ${value}${period === undefined ? '' : ` ${period}`}`} className={`relative flex h-[132px] w-[310px] items-center justify-center rounded-2xl border-[6px] bg-slate-950 ${displayClass}`}>
            <div className="absolute inset-[8px] rounded-lg border border-slate-700/70" />
            <div className="relative font-mono text-[4.6rem] font-bold leading-none tracking-[0.08em] tabular-nums">{value}</div>
            <div className="absolute right-4 top-3 text-[0.65rem] tracking-[0.2em] text-slate-500">DIGITAL</div>
            {period !== undefined && <div className="absolute bottom-3 right-4 rounded bg-slate-800 px-2 py-1 font-sans text-[0.82rem] font-bold tracking-wide text-cyan-100">{period}</div>}
        </div>
    );
}

export const TimeDigitalCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('time-digital', data, ['time', 'interval']);
    if (config.direction !== 'reading' && config.direction !== 'construction') {
        throw new ViewValidationError('time-digital', 'A reading or construction direction is required.');
    }

    const parts = validateDigitalTimeProblem(data);
    const formattedTime = formatDigitalTime(parts);
    const answer = data.period === undefined ? formattedTime : `${formattedTime} ${data.period}`;
    const isReading = config.direction === 'reading';
    const displayValue = isReading || isSolutionView ? formattedTime : formattedTime.replace(/\d/g, '–');

    return (
        <div className="flex w-full items-center justify-center bg-white p-6 font-sans">
            <div className="flex w-[520px] flex-col items-center gap-6 rounded-3xl border border-slate-200 bg-slate-50 px-8 py-7 shadow-sm">
                <div className="flex min-h-[32px] items-center justify-center text-center text-[1.35rem] font-bold leading-snug text-slate-700">
                    {isReading ? 'Read the digital clock.' : 'Build the digital time.'}
                </div>
                {!isReading && <div className="flex min-h-[86px] min-w-[300px] items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-6 text-center text-[1.4rem] font-bold text-slate-800">{formatTimeClue(parts, data.period)}</div>}
                <DigitalDisplay value={displayValue} period={data.period} highlighted={isSolutionView} />
                {isReading && (
                    <div className={`flex min-h-[76px] w-[310px] flex-col items-center justify-center rounded-xl border-2 px-5 ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-dashed border-slate-300 bg-white text-slate-500'}`}>
                        <div className="text-[0.82rem] font-bold uppercase tracking-wide">Written time</div>
                        <div aria-label="Written time response" className="mt-1 text-[1.55rem] font-bold tabular-nums">{isSolutionView ? answer : '________________'}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const TimeDigital = withConfig(TimeDigitalViewSchema, TimeDigitalCore);
let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'time-digital'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<TimeDigital payload={payload} />);
        }
    };
}
