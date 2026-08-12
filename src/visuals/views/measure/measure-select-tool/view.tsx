import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureSelectToolViewConfig, MeasureSelectToolViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasureSelectToolViewConfig;
    payload: ViewRenderPayload<'measure-select-tool'>;
}

const objectNames = {pencil: 'Pencil', book: 'Book', table: 'Table', door: 'Door'} as const;

function Tool({tool, selected}: {tool: 'ruler' | 'tape'; selected: boolean}) {
    return (
        <div className={`flex w-64 flex-col items-center gap-4 rounded-2xl border-2 p-5 ${
            selected ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-white'
        }`}>
            {tool === 'ruler' ? (
                <div className="relative h-16 w-52 border-2 border-amber-700 bg-amber-200">
                    <div className="absolute inset-x-2 top-0 flex justify-between">{Array.from({length: 11}, (_, i) => <span key={i} className="h-4 border-l border-amber-900"/>)}</div>
                </div>
            ) : (
                <div className="relative h-20 w-52">
                    <div className="absolute left-1 top-1 size-16 rounded-full border-4 border-orange-700 bg-orange-200"/>
                    <div className="absolute left-14 top-8 h-7 w-36 rounded-r-full border-2 border-amber-700 bg-amber-200"/>
                </div>
            )}
            <div className="text-lg font-bold text-slate-700">{tool === 'ruler' ? 'Ruler' : 'Measuring tape'}</div>
            {selected && <div className="font-bold text-emerald-700">Best choice ✓</div>}
        </div>
    );
}

const MeasureSelectToolCore = ({config: _config, payload}: CoreProps) => {
    const {data} = payload.problem;
    validateProblemData('measure-select-tool', data, ['object', 'correctTool', 'tools']);
    if (!['ruler', 'tape'].includes(data.correctTool) || data.tools.length !== 2) {
        throw new ViewValidationError('measure-select-tool', 'Expected ruler and measuring-tape choices.');
    }

    return (
        <div className="w-[700px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center text-xl font-bold text-slate-800">Which tool should measure this object?</div>
            <div className="mx-auto mt-5 flex h-24 w-72 items-center justify-center rounded-2xl bg-indigo-50 text-3xl font-extrabold text-indigo-800">
                {objectNames[data.object]}
            </div>
            <div className="mt-6 flex justify-center gap-6">
                {data.tools.map(tool => <Tool key={tool} tool={tool} selected={payload.isSolutionView && tool === data.correctTool}/>) }
            </div>
        </div>
    );
};

export const MeasureSelectTool = withConfig(MeasureSelectToolViewSchema, MeasureSelectToolCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measure-select-tool'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<MeasureSelectTool payload={payload}/>);
    }
};
