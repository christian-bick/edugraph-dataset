import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {LiquidVolumeEstimateProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    MeasureLiquidVolumeEstimateViewConfig,
    MeasureLiquidVolumeEstimateViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasureLiquidVolumeEstimateViewConfig;
    payload: ViewRenderPayload<'measure-liquid-volume-estimate'>;
}

const profiles: Record<LiquidVolumeEstimateProblem['container'], {name: string; estimate: number}> = {
    'water-bottle': {name: 'Water bottle', estimate: 1},
    'juice-carton': {name: 'Juice carton', estimate: 2},
    'watering-can': {name: 'Watering can', estimate: 5},
    bucket: {name: 'Bucket', estimate: 10}
};

const TargetContainer = ({container}: {container: LiquidVolumeEstimateProblem['container']}) => {
    if (container === 'water-bottle') return <g>
        <rect x="112" y="36" width="56" height="24" rx="5" fill="#0f766e" />
        <path d="M100 78 Q100 60 118 60 H162 Q180 60 180 78 L190 270 Q190 292 168 292 H112 Q90 292 90 270 Z" fill="#99f6e4" stroke="#0f766e" strokeWidth="6" />
        <path d="M94 178 H186 L190 270 Q190 292 168 292 H112 Q90 292 90 270 Z" fill="#22d3ee" opacity="0.75" />
    </g>;
    if (container === 'juice-carton') return <g>
        <path d="M82 92 L115 48 H181 L208 92 V292 H82 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="6" strokeLinejoin="round" />
        <path d="M115 48 L145 92 H208" fill="none" stroke="#b45309" strokeWidth="6" strokeLinejoin="round" />
        <circle cx="145" cy="181" r="43" fill="#fb923c" />
        <path d="M145 138 Q166 117 181 132" fill="none" stroke="#15803d" strokeWidth="7" strokeLinecap="round" />
    </g>;
    if (container === 'watering-can') return <g>
        <path d="M57 126 H188 Q207 126 207 145 V278 Q207 294 191 294 H73 Q57 294 57 278 Z" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="6" />
        <path d="M207 165 L272 112 L285 134 L207 212" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="6" strokeLinejoin="round" />
        <path d="M81 126 Q81 61 139 61 Q194 61 194 126" fill="none" stroke="#1d4ed8" strokeWidth="12" />
    </g>;
    return <g>
        <path d="M70 99 H218 L199 292 H89 Z" fill="#fde68a" stroke="#a16207" strokeWidth="6" strokeLinejoin="round" />
        <path d="M82 99 Q72 38 144 38 Q216 38 206 99" fill="none" stroke="#a16207" strokeWidth="8" />
        <path d="M75 137 H213" stroke="#a16207" strokeWidth="5" />
    </g>;
};

const MeasureLiquidVolumeEstimateCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('measure-liquid-volume-estimate', data, [
        'measurementKind', 'container', 'unit', 'estimateLiters', 'referenceLiters'
    ]);
    if (data.measurementKind !== 'liquid-volume') {
        throw new ViewValidationError('measure-liquid-volume-estimate', 'Unsupported liquid-volume estimate.');
    }
    if (!(data.container in profiles)
        || data.unit !== 'L'
        || data.referenceLiters !== 1
        || data.estimateLiters !== profiles[data.container].estimate) {
        throw new ViewValidationError('measure-liquid-volume-estimate', 'Unsupported liquid-volume estimate.');
    }
    const profile = profiles[data.container];

    return <div className="w-[650px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
        <div className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Estimate liquid volume</div>
        <div className="mt-1 text-[1.4rem] font-bold text-slate-800">About how many liters can this {profile.name.toLowerCase()} hold?</div>

        <div className="mt-6 grid grid-cols-[1fr_210px] gap-5">
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-center">
                <svg viewBox="0 0 300 320" className="mx-auto h-[310px] w-[290px]" role="img" aria-label={profile.name}>
                    <TargetContainer container={data.container} />
                </svg>
                <div className="text-xl font-bold text-slate-800">{profile.name}</div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-sky-200 bg-sky-50 p-4 text-center">
                <div className="text-sm font-bold uppercase tracking-wider text-sky-700">Reference</div>
                <svg viewBox="0 0 180 230" className="mt-2 h-[220px] w-[172px]" role="img" aria-label="One-liter measuring jug">
                    <path d="M38 28 V188 Q38 207 57 207 H122 Q141 207 141 188 V28" fill="#f8fafc" stroke="#334155" strokeWidth="5" />
                    <path d="M41 105 H138 V188 Q138 204 122 204 H57 Q41 204 41 188 Z" fill="#38bdf8" opacity="0.78" />
                    <path d="M141 62 Q176 64 168 118 Q164 148 141 148" fill="none" stroke="#334155" strokeWidth="11" strokeLinecap="round" />
                    <line x1="41" y1="105" x2="138" y2="105" stroke="#0369a1" strokeWidth="4" />
                    <text x="88" y="96" textAnchor="middle" className="fill-slate-800 text-[22px] font-extrabold">1 L</text>
                </svg>
                <div className="text-lg font-bold text-sky-900">This jug holds 1 liter.</div>
            </div>
        </div>

        <div className={`mt-5 rounded-xl border-2 px-5 py-4 text-center text-xl font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 text-slate-400'}`}>
            {isSolutionView
                ? `A good estimate is ${data.estimateLiters} ${data.estimateLiters === 1 ? 'liter' : 'liters'}.`
                : 'A good estimate is ____ liters.'}
        </div>
    </div>;
};

export const MeasureLiquidVolumeEstimate = withConfig(
    MeasureLiquidVolumeEstimateViewSchema,
    MeasureLiquidVolumeEstimateCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'measure-liquid-volume-estimate'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<MeasureLiquidVolumeEstimate payload={payload} />);
    }
};
