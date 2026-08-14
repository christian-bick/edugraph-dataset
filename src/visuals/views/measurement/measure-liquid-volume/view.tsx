import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureLiquidVolumeViewConfig, MeasureLiquidVolumeViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasureLiquidVolumeViewConfig;
    payload: ViewRenderPayload<'measure-liquid-volume'>;
}

const TOP = 35;
const BOTTOM = 335;

const MeasureLiquidVolumeCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('measure-liquid-volume', data, [
        'measurementKind', 'object', 'unit', 'value', 'capacity', 'tickStep'
    ]);
    if (data.measurementKind !== 'liquid-volume'
        || data.object !== 'measuring-jug'
        || data.unit !== 'L'
        || data.tickStep !== 1
        || !Number.isInteger(data.value)
        || !Number.isInteger(data.capacity)
        || data.value <= 0
        || data.value >= data.capacity) {
        throw new ViewValidationError('measure-liquid-volume', 'Unsupported liquid measurement.');
    }

    const toY = (value: number): number => BOTTOM - value / data.capacity * (BOTTOM - TOP);
    const levelY = toY(data.value);
    const ticks = Array.from({length: data.capacity + 1}, (_, value) => value);

    return (
        <div className="w-[610px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">Measure liquid volume</div>
            <div className="mt-1 text-[1.4rem] font-bold text-slate-800">How many liters are in the measuring jug?</div>

            <svg viewBox="0 0 540 380" className="mx-auto mt-3 h-[380px] w-[540px]" role="img" aria-label="Calibrated measuring jug containing liquid">
                <defs>
                    <linearGradient id="liquid-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.72" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
                    </linearGradient>
                </defs>
                <path d="M 160 35 L 160 320 Q 160 345 185 345 L 355 345 Q 380 345 380 320 L 380 35" fill="#f8fafc" stroke="#334155" strokeWidth="5" strokeLinejoin="round" />
                <path d={`M 163 ${levelY} L 377 ${levelY} L 377 320 Q 377 342 355 342 L 185 342 Q 163 342 163 320 Z`} fill="url(#liquid-fill)" />
                <line x1="163" y1={levelY} x2="377" y2={levelY} stroke="#0369a1" strokeWidth="4" />
                {ticks.map(value => {
                    const y = toY(value);
                    const selected = value === data.value;
                    return <g key={value}>
                        <line x1="380" y1={y} x2={selected && isSolutionView ? 480 : 465} y2={y} stroke={selected && isSolutionView ? '#059669' : '#475569'} strokeWidth={selected && isSolutionView ? 5 : 3} />
                        <text x="500" y={y + 6} className={selected && isSolutionView ? 'fill-emerald-700 text-[20px] font-bold' : 'fill-slate-700 text-[18px] font-semibold'}>{value} L</text>
                    </g>;
                })}
                <path d="M 380 92 Q 480 95 462 190 Q 452 245 380 245" fill="none" stroke="#334155" strokeWidth="16" strokeLinecap="round" />
                <path d="M 380 92 Q 464 98 448 185 Q 439 226 380 228" fill="none" stroke="white" strokeWidth="7" strokeLinecap="round" />
            </svg>

            <div className={`rounded-xl border-2 px-5 py-4 text-center text-xl font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 text-slate-400'}`}>
                {isSolutionView
                    ? `The jug contains ${data.value} ${data.value === 1 ? 'liter' : 'liters'}.`
                    : 'The jug contains ____ liters.'}
            </div>
        </div>
    );
};

export const MeasureLiquidVolume = withConfig(MeasureLiquidVolumeViewSchema, MeasureLiquidVolumeCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'measure-liquid-volume'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<MeasureLiquidVolume payload={payload} />);
    }
};
