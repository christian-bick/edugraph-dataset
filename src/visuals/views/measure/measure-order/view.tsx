import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureOrderViewConfig, MeasureOrderViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasureOrderViewConfig;
    payload: ViewRenderPayload<'measure-order'>;
}

const colors = ['bg-sky-300', 'bg-amber-300', 'bg-violet-300'];

const MeasureOrderCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('measure-order', data, ['objects', 'direction', 'order']);
    if (data.objects.length !== 3 || data.order.length !== 3
        || new Set(data.objects.map(object => object.length)).size !== 3
        || new Set(data.order).size !== 3
        || !['ascending', 'descending'].includes(data.direction)) {
        throw new ViewValidationError('measure-order', 'Expected three distinct measured objects and a complete order.');
    }

    const prompt = data.direction === 'ascending'
        ? 'Order the objects from shortest to longest.'
        : 'Order the objects from longest to shortest.';
    const answerClass = isSolutionView
        ? 'text-emerald-700 border-emerald-700 bg-emerald-50 font-bold'
        : 'text-slate-700 border-slate-400 bg-white';

    return (
        <div className="flex justify-center items-center p-8 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[520px]">
                {!isSolutionView && (
                    <div className="text-[1.3rem] font-bold text-slate-700 mb-5 text-center font-sans">{prompt}</div>
                )}
                <div className="flex flex-col gap-4 w-[430px] p-5 bg-slate-50 border-2 border-slate-200 rounded-xl">
                    {data.objects.map((object, index) => (
                        <div key={object.id} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-500 flex items-center justify-center font-bold text-slate-700">
                                {object.id}
                            </div>
                            <div className={`h-8 rounded-md border-2 border-slate-600 ${colors[index]}`} style={{width: `${object.length}px`}} />
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-3 mt-6">
                    {data.order.map((id, index) => (
                        <div key={id} className="flex items-center gap-3">
                            <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-xl ${answerClass}`}>
                                {isSolutionView ? id : ''}
                            </div>
                            {index < data.order.length - 1 && <span className="text-2xl text-slate-400">→</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const MeasureOrder = withConfig(MeasureOrderViewSchema, MeasureOrderCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'measure-order'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<MeasureOrder payload={payload} />);
    }
};
