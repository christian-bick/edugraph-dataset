import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {PlaneShapeName, ShapeAttributeClassificationProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {getShapeAppearance, ShapeAppearance} from '../helpers.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    ShapeClassifyAttributesViewConfig,
    ShapeClassifyAttributesViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const SUPPORTED_SHAPES: readonly PlaneShapeName[] = [
    'circle',
    'triangle',
    'square',
    'rectangle',
    'hexagon'
];

function ShapeExample({shape, appearance}: {shape: PlaneShapeName; appearance: ShapeAppearance}) {
    const common = {
        fill: appearance.color,
        stroke: '#334155',
        strokeWidth: 3
    };
    const style = {
        transform: `rotate(${appearance.rotation}deg) scale(${appearance.scale})`,
        transformOrigin: 'center'
    };

    return (
        <svg width="76" height="76" viewBox="0 0 100 100" className="overflow-visible" style={style}>
            {shape === 'circle' && <circle cx="50" cy="50" r="37" {...common} />}
            {shape === 'triangle' && <polygon points="50,10 90,88 10,88" {...common} />}
            {shape === 'square' && <rect x="13" y="13" width="74" height="74" rx="3" {...common} />}
            {shape === 'rectangle' && <rect x="8" y="25" width="84" height="50" rx="3" {...common} />}
            {shape === 'hexagon' && <polygon points="50,8 87,29 87,71 50,92 13,71 13,29" {...common} />}
        </svg>
    );
}

function validateClassificationProblem(data: ShapeAttributeClassificationProblem) {
    if (!SUPPORTED_SHAPES.includes(data.shape)) {
        throw new ViewValidationError('shape-classify-attributes', `Unsupported shape: ${data.shape}`);
    }
    if (!Array.isArray(data.options) || data.options.length !== 4) {
        throw new ViewValidationError('shape-classify-attributes', 'Exactly four attribute options are required.');
    }
    const ids = new Set(data.options.map(option => option.id));
    if (ids.size !== 4 || data.options.some(option => option.text.trim().length === 0)) {
        throw new ViewValidationError('shape-classify-attributes', 'Attribute options must have unique IDs and non-empty text.');
    }
    const definingOptions = data.options.filter(option => option.kind === 'defining');
    if (definingOptions.length !== 1 || definingOptions[0].id !== data.answer) {
        throw new ViewValidationError('shape-classify-attributes', 'The answer must identify the single defining option.');
    }
}

interface CoreProps {
    config: ShapeClassifyAttributesViewConfig;
    payload: ViewRenderPayload<'shape-classify-attributes'>;
}

const ShapeClassifyAttributesCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView, seed} = payload;
    validateProblemData('shape-classify-attributes', problem.data, ['shape', 'definition', 'options', 'answer']);
    const data = problem.data;
    validateClassificationProblem(data);

    const appearances = Array.from({length: 4}, (_, index) => getShapeAppearance(seed, index));

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit mx-auto font-sans">
            <div className="flex flex-col items-center w-[520px]">
                <div className="h-[58px] flex items-start justify-center text-[1.3rem] font-bold text-slate-700 text-center leading-normal">
                    {!isSolutionView && 'Which statement always describes this shape?'}
                </div>

                <div className="flex justify-around items-center w-[460px] h-[132px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[22px] px-[18px] box-border">
                    {appearances.map((appearance, index) => (
                        <div key={index} className="flex items-center justify-center w-[90px] h-[96px]">
                            <ShapeExample shape={data.shape} appearance={appearance} />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                    {data.options.map(option => {
                        const isCorrect = option.id === data.answer;
                        const solutionClass = isSolutionView && isCorrect
                            ? 'border-green-600 bg-green-50 text-green-700 font-bold shadow-[0_0_10px_rgba(22,163,74,0.2)]'
                            : 'border-slate-200 bg-white text-slate-700';
                        return (
                            <div
                                key={option.id}
                                className={`min-h-[68px] py-3 px-4 border-2 rounded-lg flex items-center gap-3 text-[0.98rem] leading-snug ${solutionClass}`}
                            >
                                <span className="font-bold text-slate-500">{option.id}</span>
                                <span>{option.text}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const ShapeClassifyAttributes = withConfig(
    ShapeClassifyAttributesViewSchema,
    ShapeClassifyAttributesCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-classify-attributes'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapeClassifyAttributes payload={payload} />);
    }
};
