import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {TenFrame} from '../../../components/TenFrame.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {PlaceValueTensBundlesViewConfig, PlaceValueTensBundlesViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueTensBundlesViewConfig;
    payload: ViewRenderPayload<'place-value-tens-bundles'>;
}

const PlaceValueTensBundlesCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('place-value-tens-bundles', data, ['tens', 'ones', 'target']);

    if (!Number.isInteger(data.tens) || data.tens < 1 || data.tens > 9
        || data.ones !== 0 || data.target !== data.tens * 10) {
        throw new ViewValidationError('place-value-tens-bundles', 'Expected 1-9 complete tens and no leftover ones.');
    }

    const answerClass = isSolutionView
        ? 'text-emerald-700 border-emerald-700 bg-emerald-50 font-bold'
        : 'text-slate-800 bg-white';

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[520px]">
                {!isSolutionView && (
                    <div className="text-[1.35rem] font-bold text-slate-700 mb-5 text-center font-sans">
                        How many are represented by these tens?
                    </div>
                )}

                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 border-[1.5px] border-dashed border-slate-300 rounded-xl mb-6">
                    {Array.from({length: data.tens}, (_, index) => (
                        <TenFrame key={index} filledCount={10} colorClass="color-a" />
                    ))}
                </div>

                <div className="flex items-center gap-3 text-[2rem] font-extrabold text-slate-700">
                    <span>{data.tens}</span>
                    <span className="text-slate-500">{data.tens === 1 ? 'ten' : 'tens'}</span>
                    <span className="text-slate-400">=</span>
                    <div className={`w-[84px] h-[58px] border-2 border-slate-600 rounded-lg flex justify-center items-center font-mono ${answerClass}`}>
                        {isSolutionView ? data.target : ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PlaceValueTensBundles = withConfig(PlaceValueTensBundlesViewSchema, PlaceValueTensBundlesCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'place-value-tens-bundles'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<PlaceValueTensBundles payload={payload} />);
    }
};
