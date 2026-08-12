import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    PlaneShapeName,
    ShapeAttributeClassificationProblem,
    ShapeCountOption
} from '../../../../types/problems.ts';
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

const VERTICES: Readonly<Record<string, readonly [number, number][]>> = {
    triangle: [[50, 10], [90, 88], [10, 88]],
    quadrilateral: [[18, 18], [87, 12], [75, 88], [10, 72]],
    pentagon: [[50, 8], [90, 38], [75, 88], [25, 88], [10, 38]],
    hexagon: [[50, 8], [87, 29], [87, 71], [50, 92], [13, 71], [13, 29]]
};

function VertexShape({shape}: {shape: ShapeCountOption['shape']}) {
    const vertices = VERTICES[shape];
    if (!vertices) {
        throw new ViewValidationError('shape-classify-attributes', `Unsupported vertex-count shape: ${shape}`);
    }
    const points = vertices.map(([x, y]) => `${x},${y}`).join(' ');
    return (
        <svg width="82" height="82" viewBox="0 0 100 100" aria-label={`${vertices.length}-vertex shape`}>
            <polygon points={points} fill="#dbeafe" stroke="#2563eb" strokeWidth="4" />
            {vertices.map(([x, y], index) => (
                <circle key={index} cx={x} cy={y} r="5" fill="#f43f5e" stroke="#9f1239" strokeWidth="1.5" />
            ))}
        </svg>
    );
}

function FaceNet({shape}: {shape: ShapeCountOption['shape']}) {
    const common = {fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 2};
    return (
        <svg width="108" height="82" viewBox="0 0 120 90" aria-label={`${shape} face net`}>
            {shape === 'cube' && (
                <>
                    <rect x="41" y="3" width="19" height="19" {...common} />
                    <rect x="41" y="22" width="19" height="19" {...common} />
                    <rect x="22" y="41" width="19" height="19" {...common} />
                    <rect x="41" y="41" width="19" height="19" {...common} />
                    <rect x="60" y="41" width="19" height="19" {...common} />
                    <rect x="41" y="60" width="19" height="19" {...common} />
                </>
            )}
            {shape === 'rectangular-prism' && (
                <>
                    <rect x="39" y="3" width="25" height="14" {...common} />
                    <rect x="39" y="17" width="25" height="19" {...common} />
                    <rect x="20" y="36" width="19" height="25" {...common} />
                    <rect x="39" y="36" width="25" height="25" {...common} />
                    <rect x="64" y="36" width="19" height="25" {...common} />
                    <rect x="39" y="61" width="25" height="14" {...common} />
                </>
            )}
            {shape === 'triangular-prism' && (
                <>
                    <rect x="22" y="29" width="25" height="30" {...common} />
                    <rect x="47" y="29" width="25" height="30" {...common} />
                    <rect x="72" y="29" width="25" height="30" {...common} />
                    <polygon points="22,29 47,29 34.5,8" {...common} />
                    <polygon points="72,59 97,59 84.5,81" {...common} />
                </>
            )}
            {shape === 'square-pyramid' && (
                <>
                    <rect x="42" y="31" width="34" height="34" {...common} />
                    <polygon points="42,31 76,31 59,5" {...common} />
                    <polygon points="76,31 76,65 105,48" {...common} />
                    <polygon points="42,65 76,65 59,87" {...common} />
                    <polygon points="42,31 42,65 13,48" {...common} />
                </>
            )}
        </svg>
    );
}

function countOptionName(shape: ShapeCountOption['shape']): string {
    return shape.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
}

function validateCountClassificationProblem(data: Extract<ShapeAttributeClassificationProblem, {task: 'classify-count'}>) {
    if (!Array.isArray(data.options) || data.options.length !== 4) {
        throw new ViewValidationError('shape-classify-attributes', 'Exactly four shape options are required.');
    }
    const ids = new Set(data.options.map(option => option.id));
    const satisfying = data.options.filter(option => option.satisfies);
    if (ids.size !== 4 || satisfying.length !== 1 || satisfying[0].id !== data.answer) {
        throw new ViewValidationError('shape-classify-attributes', 'The answer must identify one satisfying shape.');
    }
    if (data.attribute === 'vertices' && data.options.some(option => !VERTICES[option.shape])) {
        throw new ViewValidationError('shape-classify-attributes', 'Vertex-count options must be supported polygons.');
    }
}

function CountClassificationLayout({
    data,
    isSolutionView
}: {
    data: Extract<ShapeAttributeClassificationProblem, {task: 'classify-count'}>;
    isSolutionView: boolean;
}) {
    const prompt = data.attribute === 'vertices'
        ? `Which shape has ${data.requiredCount} vertices?`
        : `Which shape has ${data.requiredCount} equal faces?`;

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit mx-auto font-sans">
            <div className="flex flex-col items-center w-[520px]">
                <div className="h-[58px] flex items-start justify-center text-[1.3rem] font-bold text-slate-700 text-center leading-normal">
                    {!isSolutionView && prompt}
                </div>
                <div className="grid grid-cols-2 gap-3 w-full">
                    {data.options.map(option => {
                        const isCorrect = option.id === data.answer;
                        const solutionClass = isSolutionView && isCorrect
                            ? 'border-green-600 bg-green-50 shadow-[0_0_10px_rgba(22,163,74,0.2)]'
                            : 'border-slate-200 bg-white';
                        return (
                            <div
                                key={option.id}
                                className={`relative h-[164px] border-2 rounded-xl flex flex-col items-center justify-center gap-1 ${solutionClass}`}
                            >
                                <div className="absolute left-3 top-3 flex size-7 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                                    {option.id}
                                </div>
                                {data.attribute === 'vertices'
                                    ? <VertexShape shape={option.shape} />
                                    : <FaceNet shape={option.shape} />}
                                <div className="text-[0.9rem] font-semibold text-slate-700">
                                    {countOptionName(option.shape)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function validateClassificationProblem(
    data: Extract<ShapeAttributeClassificationProblem, {task?: undefined}>
) {
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
    const data = problem.data;

    if (data.task === 'classify-count') {
        validateProblemData('shape-classify-attributes', data, [
            'task',
            'attribute',
            'requiredCount',
            'options',
            'answer'
        ]);
        validateCountClassificationProblem(data);
        return <CountClassificationLayout data={data} isSolutionView={isSolutionView} />;
    }

    if (!('shape' in data)) {
        throw new ViewValidationError('shape-classify-attributes', 'A defining-attribute problem requires a shape.');
    }
    validateProblemData('shape-classify-attributes', data, ['shape', 'definition', 'options', 'answer']);
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
