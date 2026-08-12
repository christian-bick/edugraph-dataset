import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureLengthEstimateViewConfig, MeasureLengthEstimateViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {config: MeasureLengthEstimateViewConfig; payload: ViewRenderPayload<'measure-length-estimate'>}
const names = {crayon: 'Crayon', book: 'Book', desk: 'Desk', door: 'Door'} as const;

const MeasureLengthEstimateCore = ({config: _config, payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData('measure-length-estimate', data, ['problemLength', 'unit', 'object']);
    if (!data.unit || !data.object) throw new ViewValidationError('measure-length-estimate', 'Expected a metric unit and familiar object.');
    return (
        <div className="w-[620px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center text-xl font-bold text-slate-800">Estimate the length</div>
            <div className={`mx-auto mt-6 flex items-center justify-center rounded-xl bg-indigo-100 font-extrabold text-indigo-800 ${data.unit === 'cm' ? 'h-24 w-64 text-3xl' : 'h-32 w-80 text-4xl'}`}>
                {names[data.object]}
            </div>
            <div className="mt-6 text-center text-lg font-semibold text-slate-700">About how many {data.unit === 'cm' ? 'centimeters' : 'meters'} long?</div>
            <div className="mx-auto mt-4 flex h-16 w-44 items-center justify-center rounded-xl border-2 border-slate-700 font-mono text-2xl font-bold text-emerald-700">
                {payload.isSolutionView ? `${data.problemLength} ${data.unit}` : ''}
            </div>
        </div>
    );
};
export const MeasureLengthEstimate = withConfig(MeasureLengthEstimateViewSchema, MeasureLengthEstimateCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measure-length-estimate'>) => {const el=document.getElementById('view'); if(el){if(!root)root=createRoot(el);root.render(<MeasureLengthEstimate payload={payload}/>);}};
