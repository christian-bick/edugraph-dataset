import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {getTracePath} from './helpers.ts';
import {ShapeDrawShapeViewConfig, ShapeDrawShapeViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeDrawShapeViewConfig;
    payload: ViewRenderPayload<'shape-draw-shape'>;
}

const ShapeDrawShapeCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('shape-draw-shape', data, ['shape', 'answer']);

    const shape = data.shape;

    if (shape !== 'circle' && shape !== 'triangle' && shape !== 'square') {
        throw new ViewValidationError('shape-draw-shape', `Unsupported shape: ${shape}`);
    }

    const promptText = `Trace the ${shape}.`;
    const pathD = getTracePath(shape);

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                {!isSolutionView && (
                    <div className="text-[1.3rem] font-bold text-slate-700 mb-[25px] text-center leading-normal">
                        {promptText}
                    </div>
                )}
                
                <div className="flex justify-center items-center w-[420px] h-[220px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px] p-[15px] box-border">
                    <svg width="150" height="150" viewBox="0 0 100 100" className="overflow-visible">
                        {/* Dotted outline */}
                        <path d={pathD} fill="none" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="4 4" />
                        {/* Solid trace path in solution view */}
                        {isSolutionView && (
                            <path d={pathD} fill="none" stroke="forestgreen" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                    </svg>
                </div>
            </div>
        </div>
    );
};

export const ShapeDrawShape = withConfig(ShapeDrawShapeViewSchema, ShapeDrawShapeCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-draw-shape'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<ShapeDrawShape payload={payload} />);
    }
};
