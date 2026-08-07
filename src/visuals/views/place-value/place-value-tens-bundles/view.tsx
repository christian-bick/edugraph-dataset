import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {TenFrame} from '../../../components/TenFrame.tsx';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateBundleProblem} from './helpers.ts';
import {PlaceValueTensBundlesViewConfig, PlaceValueTensBundlesViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueTensBundlesViewConfig;
    payload: ViewRenderPayload<'place-value-tens-bundles'>;
}

function IndividualOnes({count, showCount}: {count: number; showCount: boolean}) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="grid grid-cols-5 gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-white p-3">
                {Array.from({length: count}, (_, index) => (
                    <span
                        key={index}
                        className="h-[22px] w-[22px] rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_2px_4px_rgba(190,18,60,0.3)]"
                    />
                ))}
            </div>
            <span className="text-sm font-bold text-slate-600">
                <span className={showCount ? '' : 'invisible'}>{count} </span>
                individual ones
            </span>
        </div>
    );
}

function SingleTenTransformation({onesCount, showCount}: {onesCount: number; showCount: boolean}) {
    return (
        <div className="flex items-center gap-5 rounded-2xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 p-5">
            <IndividualOnes count={onesCount} showCount={showCount}/>
            <span className="text-4xl font-bold text-slate-400" aria-label="becomes">→</span>
            <div className="flex flex-col items-center gap-2 rounded-xl border-4 border-sky-500 bg-sky-50 p-3">
                <TenFrame filledCount={10} colorClass="color-a"/>
                <span className="text-sm font-bold text-sky-800">1 grouped ten</span>
            </div>
        </div>
    );
}

function MultipleTens({count}: {count: number}) {
    return (
        <div className="grid grid-cols-3 gap-3 rounded-xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 p-4">
            {Array.from({length: count}, (_, index) => (
                <TenFrame key={index} filledCount={10} colorClass="color-a"/>
            ))}
        </div>
    );
}

const PlaceValueTensBundlesCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('place-value-tens-bundles', data, ['tens', 'ones', 'target']);
    validateBundleProblem(data);

    const isSingleTen = data.tens === 1;

    const answerClass = isSolutionView
        ? 'text-emerald-700 border-emerald-700 bg-emerald-50 font-bold'
        : 'text-slate-800 bg-white';

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[520px]">
                <div className="mb-5 flex h-[32px] items-center justify-center text-center font-sans text-[1.35rem] font-bold text-slate-700">
                    {!isSolutionView
                        ? (isSingleTen ? 'How many ones make one ten?' : 'How many are represented by these tens?')
                        : ''
                    }
                </div>

                <div className="mb-6">
                    {isSingleTen
                        ? <SingleTenTransformation onesCount={data.target} showCount={isSolutionView}/>
                        : <MultipleTens count={data.tens}/>
                    }
                </div>

                <div className="flex items-center gap-3 text-[2rem] font-extrabold text-slate-700">
                    <span>{data.tens}</span>
                    <span className="text-slate-500">{data.tens === 1 ? 'ten' : 'tens'}</span>
                    <span className="text-slate-400">=</span>
                    <div className={`w-[84px] h-[58px] border-2 border-slate-600 rounded-lg flex justify-center items-center font-mono ${answerClass}`}>
                        {isSolutionView ? data.target : ''}
                    </div>
                    {isSingleTen && <span className="text-slate-500">ones</span>}
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
