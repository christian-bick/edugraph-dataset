import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureUnitScaleRelationViewConfig, MeasureUnitScaleRelationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {config: MeasureUnitScaleRelationViewConfig; payload: ViewRenderPayload<'measure-unit-scale-relation'>}

function UnitRow({count, small}: {count: number; small: boolean}) {
    return (
        <div className="flex w-[600px] overflow-hidden rounded-lg border-2 border-slate-700">
            {Array.from({length: count}, (_, i) => (
                <span key={i} className={`${small ? 'h-12' : 'h-16'} flex-1 border-r border-slate-500 last:border-r-0 ${small ? 'bg-sky-100' : 'bg-indigo-100'}`}/>
            ))}
        </div>
    );
}

const MeasureUnitScaleRelationCore = ({config: _config, payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData('measure-unit-scale-relation', data, ['largeUnitCount', 'smallUnitCount', 'unitsPerLarge']);
    if (data.smallUnitCount !== data.largeUnitCount * data.unitsPerLarge || data.unitsPerLarge <= 1) {
        throw new ViewValidationError('measure-unit-scale-relation', 'Expected equivalent unit partitions of one length.');
    }
    return (
        <div className="w-[700px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center text-xl font-bold text-slate-800">The same length, measured two ways</div>
            <div className="mt-6 space-y-6">
                <div><div className="mb-2 font-bold text-indigo-800">{data.largeUnitCount} large units</div><UnitRow count={data.largeUnitCount} small={false}/></div>
                <div><div className="mb-2 font-bold text-sky-800">{data.smallUnitCount} small units</div><UnitRow count={data.smallUnitCount} small/></div>
            </div>
            <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-center text-lg font-semibold text-amber-900">
                {payload.isSolutionView
                    ? `Smaller units need a larger count: ${data.smallUnitCount} > ${data.largeUnitCount}.`
                    : 'Which unit size needs more units to cover the same length?'}
            </div>
        </div>
    );
};

export const MeasureUnitScaleRelation = withConfig(MeasureUnitScaleRelationViewSchema, MeasureUnitScaleRelationCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measure-unit-scale-relation'>) => {
    const container = document.getElementById('view');
    if (container) {if (!root) root = createRoot(container); root.render(<MeasureUnitScaleRelation payload={payload}/>);}
};
