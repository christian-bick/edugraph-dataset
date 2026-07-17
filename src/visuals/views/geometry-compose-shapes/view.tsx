import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../types/ml-engine.ts';
import { GeometryComposeShapesViewConfig, GeometryComposeShapesViewSchema } from './spec.ts';
import { withConfig } from '../withConfig.tsx';
import '../../../tailwind.css';

interface CoreProps {
    config: GeometryComposeShapesViewConfig;
    payload: ViewRenderPayload<'geometry-compose-shapes'>;
}

const GeometryComposeShapesCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    const target = data.target || 'rectangle';
    const answer = data.answer;

    const promptText = `Which two shapes can you join to make a ${target}?`;
    
    // We can use the config to determine options, falling back to all options if none are resolved from labels
    const options = [];
    if (config.hasTriangle) options.push('triangle');
    if (config.hasCircle) options.push('circle');
    
    if (options.length === 0) {
        options.push('triangle', 'circle');
    }

    const getBtnClass = (opt: string) => {
        let cls = "flex-1 min-w-[120px] py-3 px-2.5 border-2 rounded-lg text-center font-semibold text-[1rem] transition-all duration-200 cursor-pointer ";
        if (opt === answer && isSolutionView) {
            cls += "border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold";
        } else {
            cls += "border-slate-200 bg-white text-slate-600";
        }
        return cls;
    };

    const getLabelText = (opt: string) => {
        return 'Two ' + (opt === 'triangle' ? 'triangles' : 'circles');
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.3rem] font-bold text-slate-700 mb-[25px] text-center leading-normal">
                    {promptText}
                </div>
                
                <div className="flex justify-center items-center w-[420px] h-[220px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px] p-[15px] box-border">
                    <div className="flex gap-[30px] items-center justify-center w-full">
                        <div className="relative w-[100px] h-[70px] border-2 border-dashed border-slate-500 rounded flex justify-center items-center font-bold text-slate-500">
                            Target: {target.toUpperCase()}
                            {isSolutionView && target === 'rectangle' && (
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <line x1="0" y1="0" x2="100" y2="70" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="3 3" />
                                </svg>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full justify-center">
                    {options.map((opt, i) => (
                        <div key={i} className={getBtnClass(opt)}>
                            {getLabelText(opt)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const GeometryComposeShapes = withConfig(GeometryComposeShapesViewSchema, GeometryComposeShapesCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-compose-shapes'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<GeometryComposeShapes payload={payload} />);
    }
};
