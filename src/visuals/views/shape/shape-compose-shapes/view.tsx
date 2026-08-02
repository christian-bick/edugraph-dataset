import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../../types/ml-engine.ts';
import { ShapeComposeShapesViewConfig, ShapeComposeShapesViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData, ViewValidationError } from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeComposeShapesViewConfig;
    payload: ViewRenderPayload<'shape-compose-shapes'>;
}

const ShapeComposeShapesCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('shape-compose-shapes', data, ['target', 'components', 'options', 'answer']);

    const target = data.target;
    const options = data.options;
    const answer = data.answer;

    if (!SUPPORTED_TARGETS.includes(target)) {
        throw new ViewValidationError('shape-compose-shapes', `Unsupported target shape: ${target}`);
    }

    if (options.length !== 2 || !options.includes(answer)) {
        throw new ViewValidationError('shape-compose-shapes', 'Options must contain exactly two choices including the answer');
    }

    const promptText = `Which pieces can you join to make a ${target}?`;

    const getBtnClass = (opt: string) => {
        let cls = "flex-1 min-w-[120px] py-3 px-2.5 border-2 rounded-lg text-center font-semibold text-[1rem] transition-all duration-200 cursor-pointer ";
        if (opt === answer && isSolutionView) {
            cls += "border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold";
        } else {
            cls += "border-slate-200 bg-white text-slate-600";
        }
        return cls;
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
                    <div className="flex flex-col items-center gap-3">
                        <CompositionDiagram target={target} showSeams={isSolutionView} />
                        <span className="font-bold text-slate-500 uppercase">Target: {target}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full justify-center">
                    {options.map((opt, i) => (
                        <div key={i} className={getBtnClass(opt)}>
                            {opt}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SUPPORTED_TARGETS = [
    'rectangle', 'square', 'triangle', 'hexagon', 'trapezoid',
    'half circle', 'quarter circle', 'cube', 'rectangular prism', 'cone', 'cylinder'
];

interface DiagramProps {
    target: string;
    showSeams: boolean;
}

const CompositionDiagram = ({target, showSeams}: DiagramProps) => {
    const outline = {fill: '#f8fafc', stroke: '#475569', strokeWidth: 3};
    const seam = {stroke: '#ef4444', strokeWidth: 2.5, strokeDasharray: '5 4'};

    return (
        <svg width="230" height="160" viewBox="0 0 220 160" role="img" aria-label={`${target} composition diagram`}>
            {target === 'rectangle' && <>
                <rect x="35" y="40" width="150" height="90" rx="3" {...outline} />
                {showSeams && <line x1="35" y1="40" x2="185" y2="130" {...seam} />}
            </>}
            {target === 'square' && <>
                <rect x="60" y="25" width="110" height="110" rx="3" {...outline} />
                {showSeams && <line x1="60" y1="25" x2="170" y2="135" {...seam} />}
            </>}
            {target === 'triangle' && <>
                <polygon points="110,18 30,135 190,135" {...outline} />
                {showSeams && <line x1="110" y1="18" x2="110" y2="135" {...seam} />}
            </>}
            {target === 'hexagon' && <>
                <polygon points="65,25 155,25 200,80 155,135 65,135 20,80" {...outline} />
                {showSeams && <>
                    <line x1="20" y1="80" x2="200" y2="80" {...seam} />
                    <line x1="65" y1="25" x2="155" y2="135" {...seam} />
                    <line x1="155" y1="25" x2="65" y2="135" {...seam} />
                </>}
            </>}
            {target === 'trapezoid' && <>
                <polygon points="65,35 155,35 195,130 25,130" {...outline} />
                {showSeams && <>
                    <line x1="65" y1="35" x2="110" y2="130" {...seam} />
                    <line x1="155" y1="35" x2="110" y2="130" {...seam} />
                </>}
            </>}
            {target === 'half circle' && <>
                <path d="M 25 125 A 85 85 0 0 1 195 125 L 25 125 Z" {...outline} />
                {showSeams && <line x1="110" y1="40" x2="110" y2="125" {...seam} />}
            </>}
            {target === 'quarter circle' && <>
                <path d="M 45 135 L 45 35 A 100 100 0 0 1 145 135 Z" {...outline} />
                {showSeams && <line x1="45" y1="135" x2="116" y2="64" {...seam} />}
            </>}
            {target === 'cube' && <WireframeBox width={82} showSeams={showSeams} />}
            {target === 'rectangular prism' && <WireframeBox width={135} showSeams={showSeams} />}
            {target === 'cone' && <>
                <path d="M 110 20 L 45 125 A 65 18 0 0 0 175 125 Z" {...outline} />
                <ellipse cx="110" cy="125" rx="65" ry="18" fill="none" stroke="#475569" strokeWidth="3" />
                {showSeams && <line x1="110" y1="20" x2="110" y2="143" {...seam} />}
            </>}
            {target === 'cylinder' && <>
                <path d="M 55 40 L 55 125 A 55 16 0 0 0 165 125 L 165 40" {...outline} />
                <ellipse cx="110" cy="40" rx="55" ry="16" {...outline} />
                <ellipse cx="110" cy="125" rx="55" ry="16" fill="none" stroke="#475569" strokeWidth="3" />
                {showSeams && <ellipse cx="110" cy="83" rx="55" ry="16" fill="none" {...seam} />}
            </>}
        </svg>
    );
};

const WireframeBox = ({width, showSeams}: {width: number; showSeams: boolean}) => {
    const left = (220 - width) / 2;
    const backLeft = left - 22;
    const outline = {fill: '#f8fafc', stroke: '#475569', strokeWidth: 3};
    const seam = {stroke: '#ef4444', strokeWidth: 2.5, strokeDasharray: '5 4'};
    const mid = left + width / 2;

    return <>
        <rect x={backLeft} y="28" width={width} height="82" {...outline} />
        <rect x={left} y="50" width={width} height="82" {...outline} />
        <line x1={backLeft} y1="28" x2={left} y2="50" stroke="#475569" strokeWidth="3" />
        <line x1={backLeft + width} y1="28" x2={left + width} y2="50" stroke="#475569" strokeWidth="3" />
        <line x1={backLeft} y1="110" x2={left} y2="132" stroke="#475569" strokeWidth="3" />
        <line x1={backLeft + width} y1="110" x2={left + width} y2="132" stroke="#475569" strokeWidth="3" />
        {showSeams && <>
            <line x1={mid - 22} y1="28" x2={mid} y2="50" {...seam} />
            <line x1={mid} y1="50" x2={mid} y2="132" {...seam} />
        </>}
    </>;
};

export const ShapeComposeShapes = withConfig(ShapeComposeShapesViewSchema, ShapeComposeShapesCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-compose-shapes'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<ShapeComposeShapes payload={payload} />);
    }
};
