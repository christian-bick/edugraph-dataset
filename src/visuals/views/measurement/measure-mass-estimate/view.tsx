import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {MassEstimateProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureMassEstimateViewConfig, MeasureMassEstimateViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {config: MeasureMassEstimateViewConfig; payload: ViewRenderPayload<'measure-mass-estimate'>}

const profiles: Record<MassEstimateProblem['object'], {name: string; unit: 'g' | 'kg'; estimate: number; color: string}> = {
    crayon: {name: 'Crayon', unit: 'g', estimate: 10, color: 'bg-rose-100 text-rose-800'},
    apple: {name: 'Apple', unit: 'g', estimate: 200, color: 'bg-red-100 text-red-800'},
    book: {name: 'Book', unit: 'g', estimate: 500, color: 'bg-indigo-100 text-indigo-800'},
    backpack: {name: 'Backpack', unit: 'kg', estimate: 3, color: 'bg-orange-100 text-orange-800'},
    chair: {name: 'Chair', unit: 'kg', estimate: 5, color: 'bg-amber-100 text-amber-800'},
    bicycle: {name: 'Bicycle', unit: 'kg', estimate: 12, color: 'bg-cyan-100 text-cyan-800'}
};

const ReferencePicture = ({unit}: {unit: 'g' | 'kg'}) => unit === 'g'
    ? <svg viewBox="0 0 180 210" className="h-[210px] w-[180px]" role="img" aria-label="Paperclip on a digital scale reading 1 gram">
        <path d="M108 25 C136 25 143 52 124 69 L80 109 C57 130 27 101 50 80 L96 38 C108 27 126 43 114 54 L72 93" fill="none" stroke="#475569" strokeWidth="9" strokeLinecap="round" />
        <path d="M30 126 H150 L163 190 H17 Z" fill="#dbeafe" stroke="#334155" strokeWidth="5" strokeLinejoin="round" />
        <rect x="55" y="147" width="70" height="30" rx="5" fill="#0f172a" />
        <text x="90" y="169" textAnchor="middle" className="fill-emerald-300 text-[20px] font-bold">1 g</text>
    </svg>
    : <svg viewBox="0 0 180 210" className="h-[210px] w-[180px]" role="img" aria-label="Bag on a digital scale reading 1 kilogram">
        <path d="M63 20 H117 L126 39 L136 123 H44 L54 39 Z" fill="#fef3c7" stroke="#a16207" strokeWidth="5" strokeLinejoin="round" />
        <path d="M54 39 H126" stroke="#a16207" strokeWidth="5" />
        <text x="90" y="82" textAnchor="middle" className="fill-amber-900 text-[22px] font-extrabold">1 kg bag</text>
        <path d="M30 126 H150 L163 190 H17 Z" fill="#dbeafe" stroke="#334155" strokeWidth="5" strokeLinejoin="round" />
        <rect x="48" y="147" width="84" height="30" rx="5" fill="#0f172a" />
        <text x="90" y="169" textAnchor="middle" className="fill-emerald-300 text-[19px] font-bold">1 kg</text>
    </svg>;

const MeasureMassEstimateCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('measure-mass-estimate', data, [
        'measurementKind', 'object', 'unit', 'estimate', 'referenceCount', 'referenceObject', 'referenceValue'
    ]);
    if (data.measurementKind !== 'mass') throw new ViewValidationError('measure-mass-estimate', 'Expected mass estimation.');
    if (!(data.object in profiles)
        || data.unit !== profiles[data.object].unit
        || data.estimate !== profiles[data.object].estimate
        || data.referenceCount !== data.estimate
        || data.referenceValue !== 1
        || data.referenceObject !== (data.unit === 'g' ? 'paperclip' : 'one-kilogram-bag')) {
        throw new ViewValidationError('measure-mass-estimate', 'Unsupported mass estimate.');
    }
    const profile = profiles[data.object];

    return <div className="w-[650px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
        <div className="text-sm font-bold uppercase tracking-[0.16em] text-fuchsia-700">Estimate mass</div>
        <div className="mt-1 text-[1.4rem] font-bold text-slate-800">About how many {data.unit} is the {profile.name.toLowerCase()}?</div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-semibold text-slate-700">
            <div className="rounded-lg bg-slate-100 p-2"><b>1.</b> Read the reference:<br />1 {data.unit}</div>
            <div className="rounded-lg bg-slate-100 p-2"><b>2.</b> Estimate matching references:<br />{isSolutionView ? `about ${data.referenceCount}` : 'about ____'}</div>
            <div className="rounded-lg bg-slate-100 p-2"><b>3.</b> Combine:<br />{isSolutionView ? `1 ${data.unit} × ${data.referenceCount} ≈ ${data.estimate} ${data.unit}` : `1 ${data.unit} × ____ ≈ ____ ${data.unit}`}</div>
        </div>
        <div className="mt-6 grid grid-cols-[1fr_215px] gap-5">
            <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 p-5">
                <div className={`flex h-40 w-64 items-center justify-center rounded-3xl text-4xl font-extrabold ${profile.color}`}>{profile.name}</div>
                <div className="mt-6 text-lg font-bold text-slate-700">Object to estimate</div>
            </div>
            <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-violet-200 bg-violet-50 p-4">
                <div className="text-sm font-bold uppercase tracking-wider text-violet-700">Reference</div>
                <ReferencePicture unit={data.unit} />
            </div>
        </div>
        <div className={`mt-5 rounded-xl border-2 px-5 py-4 text-center text-xl font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 text-slate-400'}`}>
            {isSolutionView ? `A good estimate is ${data.estimate} ${data.unit}.` : `A good estimate is ____ ${data.unit}.`}
        </div>
    </div>;
};

export const MeasureMassEstimate = withConfig(MeasureMassEstimateViewSchema, MeasureMassEstimateCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measure-mass-estimate'>) => {const el=document.getElementById('view');if(el){if(!root)root=createRoot(el);root.render(<MeasureMassEstimate payload={payload}/>);}};
