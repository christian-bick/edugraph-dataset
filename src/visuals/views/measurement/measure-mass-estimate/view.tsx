import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {MassEstimateProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureMassEstimateViewConfig, MeasureMassEstimateViewSchema} from './spec.ts';
import {ReferenceObjects, TargetObject} from './illustrations.tsx';
import '../../../../tailwind.css';

interface CoreProps {config: MeasureMassEstimateViewConfig; payload: ViewRenderPayload<'measure-mass-estimate'>}

const profiles: Record<MassEstimateProblem['object'], {name: string; unit: 'g' | 'kg'; estimate: number}> = {
    crayon: {name: 'Crayon', unit: 'g', estimate: 10},
    apple: {name: 'Apple', unit: 'g', estimate: 200},
    book: {name: 'Book', unit: 'g', estimate: 500},
    backpack: {name: 'Backpack', unit: 'kg', estimate: 3},
    chair: {name: 'Chair', unit: 'kg', estimate: 5},
    bicycle: {name: 'Bicycle', unit: 'kg', estimate: 12}
};

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
            <div className="rounded-lg bg-slate-100 p-2"><b>2.</b> Count matching references:<br />{isSolutionView ? `about ${data.referenceCount}` : 'about ____'}</div>
            <div className="rounded-lg bg-slate-100 p-2"><b>3.</b> Combine:<br />{isSolutionView ? `1 ${data.unit} × ${data.referenceCount} ≈ ${data.estimate} ${data.unit}` : `1 ${data.unit} × ____ ≈ ____ ${data.unit}`}</div>
        </div>
        <div className="mt-5 text-center text-lg font-bold text-fuchsia-800">About the same mass</div>
        <div className="mt-2 grid grid-cols-[1fr_32px_1fr] items-center gap-2">
            <div className="flex h-[275px] flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50 p-3">
                <svg viewBox="0 0 280 210" className="h-[190px] w-full" role="img" aria-label={profile.name}>
                    <TargetObject object={data.object} />
                </svg>
                <div className="mt-3 text-xl font-bold text-slate-700">{profile.name}</div>
            </div>
            <div className="text-center text-4xl font-bold text-fuchsia-700" aria-label="approximately equal mass">≈</div>
            <div className="flex h-[275px] flex-col items-center justify-center rounded-2xl border-2 border-violet-200 bg-violet-50 p-3">
                <div className="text-sm font-bold uppercase tracking-wider text-violet-700">Reference objects</div>
                <ReferenceObjects referenceCount={data.referenceCount} unit={data.unit} />
                <div className="text-center text-base font-bold text-violet-900">
                    {data.unit === 'g' ? 'Each paperclip: 1 g' : 'Each bag: 1 kg'}
                </div>
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
