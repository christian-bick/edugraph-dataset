import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeBuildShapeViewConfig, ShapeBuildShapeViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

function ShapeSVG({ shape, size = 100 }: { shape: string; size?: number }) {
    let vertices: Array<{ x: number; y: number }> = [];

    if (shape === 'square') {
        vertices = [{ x: 15, y: 15 }, { x: 85, y: 15 }, { x: 85, y: 85 }, { x: 15, y: 85 }];
    } else if (shape === 'rectangle') {
        vertices = [{ x: 10, y: 25 }, { x: 90, y: 25 }, { x: 90, y: 75 }, { x: 10, y: 75 }];
    } else if (shape === 'triangle') {
        vertices = [{ x: 50, y: 15 }, { x: 85, y: 85 }, { x: 15, y: 85 }];
    } else if (shape === 'hexagon') {
        vertices = [
            { x: 50, y: 10 }, { x: 85, y: 30 }, { x: 85, y: 70 },
            { x: 50, y: 90 }, { x: 15, y: 70 }, { x: 15, y: 30 }
        ];
    } else {
        throw new ViewValidationError('shape-build-shape', `Unsupported shape: ${shape}`);
    }

    const pointsStr = vertices.map(v => `${v.x},${v.y}`).join(' ');

    return (
        <svg width={size} height={size} viewBox="0 0 100 100" className="overflow-visible">
            {/* Sticks (sides) */}
            <polygon points={pointsStr} fill="none" stroke="#64748b" strokeWidth="5" strokeLinejoin="miter" />
            {/* Clay balls (corners) */}
            {vertices.map((v, i) => (
                <circle key={i} cx={v.x} cy={v.y} r="7" fill="#e11d48" stroke="#be123c" strokeWidth="1.5" />
            ))}
        </svg>
    );
}

interface CoreProps {
    config: ShapeBuildShapeViewConfig;
    payload: ViewRenderPayload<'shape-build-shape'>;
}

const ShapeBuildShapeCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    validateProblemData('shape-build-shape', problem.data, ['target', 'sides', 'corners']);
    const { target, sides, corners } = problem.data;

    const promptText = `To build a ${target}, how many sticks (sides) and clay balls (corners) do you need?`;
    const options = ['3 sticks, 3 balls', '4 sticks, 4 balls', '6 sticks, 6 balls'];

    const getBtnClass = (opt: string) => {
        let cls = "flex-1 min-w-[120px] py-3 px-2.5 border-2 rounded-lg text-center font-semibold text-[1rem] transition-all duration-200 cursor-pointer ";
        const isCorrect = opt === `${sides} sticks, ${corners} balls`;
        if (isCorrect && isSolutionView) {
            cls += "border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold";
        } else {
            cls += "border-slate-200 bg-white text-slate-600";
        }
        return cls;
    };

    const getLabelText = (opt: string) => {
        return opt.charAt(0).toUpperCase() + opt.slice(1);
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                {!isSolutionView && (
                    <div className="text-[1.3rem] font-bold text-slate-700 mb-[25px] text-center leading-normal">
                        {promptText}
                    </div>
                )}
                
                <div className="flex justify-center items-center w-[420px] h-[220px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px] p-[15px] box-border">
                    <div className="flex gap-5 items-center justify-center w-full">
                        <div className="p-2.5 bg-white border border-dashed border-slate-300 rounded-lg flex flex-col gap-2">
                            <div className="flex gap-1.5 items-center font-bold text-slate-500">
                                <span className="inline-block w-[30px] h-1 bg-slate-500" /> Stick (Side)
                            </div>
                            <div className="flex gap-1.5 items-center font-bold text-slate-500">
                                <span className="inline-block w-3.5 h-3.5 rounded-full bg-rose-600" /> Clay Ball (Corner)
                            </div>
                        </div>
                        <ShapeSVG shape={target} size={80} />
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

export const ShapeBuildShape = withConfig(ShapeBuildShapeViewSchema, ShapeBuildShapeCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-build-shape'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<ShapeBuildShape payload={payload} />);
    }
};
