import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {ShapePartitionEqualViewConfig, ShapePartitionEqualViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapePartitionEqualViewConfig;
    payload: ViewRenderPayload<'shape-partition-equal'>;
}

const ShapePartitionEqualCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('shape-partition-equal', data, ['shape', 'parts']);
    if (!['circle', 'rectangle'].includes(data.shape) || ![2, 4].includes(data.parts)) {
        throw new ViewValidationError('shape-partition-equal', 'Expected a circle or rectangle split into two or four parts.');
    }

    const lineClass = isSolutionView ? 'stroke-emerald-700' : 'stroke-transparent';
    return (
        <div className="flex justify-center items-center p-8 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                {!isSolutionView && (
                    <div className="text-[1.35rem] font-bold text-slate-700 mb-5 text-center font-sans">
                        Partition the shape into {data.parts} equal parts.
                    </div>
                )}
                <div className="w-[350px] h-[250px] bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center">
                    <svg viewBox="0 0 300 200" className="w-[300px] h-[200px]" aria-label={`${data.shape} partitioned into ${data.parts} equal parts`}>
                        {data.shape === 'circle' ? (
                            <circle cx="150" cy="100" r="78" fill="#dbeafe" stroke="#334155" strokeWidth="5" />
                        ) : (
                            <rect x="45" y="35" width="210" height="130" rx="5" fill="#fef3c7" stroke="#334155" strokeWidth="5" />
                        )}
                        <line x1="150" y1={data.shape === 'circle' ? 22 : 35} x2="150" y2={data.shape === 'circle' ? 178 : 165} className={lineClass} strokeWidth="6" />
                        {data.parts === 4 && (
                            <line x1={data.shape === 'circle' ? 72 : 45} y1="100" x2={data.shape === 'circle' ? 228 : 255} y2="100" className={lineClass} strokeWidth="6" />
                        )}
                    </svg>
                </div>
                <div className="mt-5 px-5 py-2 rounded-full bg-slate-100 text-lg font-bold text-slate-600">
                    {data.parts} equal parts · each part = 1/{data.parts}
                </div>
            </div>
        </div>
    );
};

export const ShapePartitionEqual = withConfig(ShapePartitionEqualViewSchema, ShapePartitionEqualCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-partition-equal'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapePartitionEqual payload={payload} />);
    }
};
