import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    ShapeComposeShapesProblem,
    ShapeCompositionComposite,
    ShapeCompositionNode
} from '../../../../types/problems.ts';
import {ShapeComposeShapesViewConfig, ShapeComposeShapesViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeComposeShapesViewConfig;
    payload: ViewRenderPayload<'shape-compose-shapes'>;
}

const validateNode = (node: ShapeCompositionNode, path: string): number => {
    if (!node || typeof node !== 'object' || typeof node.shape !== 'string' || node.shape.length === 0) {
        throw new ViewValidationError('shape-compose-shapes', `${path} must name a shape.`);
    }
    if (node.kind === 'primitive') return 0;
    if (node.kind !== 'composite' || !Array.isArray(node.inputs) || node.inputs.length < 2) {
        throw new ViewValidationError('shape-compose-shapes', `${path} must be a composite with at least two inputs.`);
    }
    return 1 + Math.max(...node.inputs.map((input, index) => validateNode(input, `${path}.inputs[${index}]`)));
};

const validateComposition = (data: ShapeComposeShapesProblem) => {
    if (!SUPPORTED_TARGETS.includes(data.target)) {
        throw new ViewValidationError('shape-compose-shapes', `Unsupported target shape: ${data.target}`);
    }
    if (
        !Array.isArray(data.options)
        || data.options.length !== 2
        || new Set(data.options).size !== 2
        || data.options.some(option => typeof option !== 'string' || option.length === 0)
        || !data.options.includes(data.answer)
    ) {
        throw new ViewValidationError('shape-compose-shapes', 'Options must contain exactly two choices including the answer.');
    }
    if (
        !Array.isArray(data.components)
        || data.components.length === 0
        || data.components.some(component => typeof component !== 'string' || component.length === 0)
    ) {
        throw new ViewValidationError('shape-compose-shapes', 'At least one component is required.');
    }
    if (!data.compositionTree || data.compositionTree.kind !== 'composite') {
        throw new ViewValidationError('shape-compose-shapes', 'The composition tree root must be composite.');
    }
    const derivedDepth = validateNode(data.compositionTree, 'compositionTree');
    if (data.compositionDepth !== 1 && data.compositionDepth !== 2) {
        throw new ViewValidationError('shape-compose-shapes', 'Composition depth must be 1 or 2.');
    }
    if (derivedDepth !== data.compositionDepth || data.compositionTree.shape !== data.target) {
        throw new ViewValidationError('shape-compose-shapes', 'The composition tree must match its declared depth and target.');
    }
    const projectedComponents = data.compositionTree.inputs.map(input => input.shape);
    if (
        projectedComponents.length !== data.components.length
        || projectedComponents.some((shape, index) => shape !== data.components[index])
    ) {
        throw new ViewValidationError('shape-compose-shapes', 'Components must project the root composition inputs in order.');
    }
    if (data.compositionDepth === 1 && data.compositionTree.inputs.some(input => input.kind !== 'primitive')) {
        throw new ViewValidationError('shape-compose-shapes', 'Single-level composition inputs must all be primitive.');
    }
    if (data.compositionDepth === 2 && !data.compositionTree.inputs.some(input => input.kind === 'composite')) {
        throw new ViewValidationError('shape-compose-shapes', 'Multi-level composition requires a composed intermediate input.');
    }
};

const optionClass = (isCorrect: boolean, isSolutionView: boolean) => {
    const base = 'flex-1 min-w-[120px] py-3 px-2.5 border-2 rounded-lg text-center font-semibold text-[1rem]';
    return isCorrect && isSolutionView
        ? `${base} border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold`
        : `${base} border-slate-200 bg-white text-slate-600`;
};

function OptionRow({data, isSolutionView}: {data: ShapeComposeShapesProblem; isSolutionView: boolean}) {
    return (
        <div className="flex flex-wrap gap-3 w-full justify-center">
            {data.options.map(option => (
                <div key={option} className={optionClass(option === data.answer, isSolutionView)}>
                    {option}
                </div>
            ))}
        </div>
    );
}

function SingleLevelLayout({data, isSolutionView}: {data: ShapeComposeShapesProblem; isSolutionView: boolean}) {
    const promptText = `Which pieces can you join to make a ${data.target}?`;

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="h-[58px] flex items-start justify-center text-[1.3rem] font-bold text-slate-700 text-center leading-normal">
                    {!isSolutionView && promptText}
                </div>

                <div className="flex justify-center items-center w-[420px] h-[220px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px] p-[15px] box-border">
                    <div className="flex flex-col items-center gap-3">
                        <CompositionDiagram
                            target={data.target}
                            componentShape={data.compositionTree.inputs[0].shape}
                            showSeams={isSolutionView}
                        />
                        <span className="font-bold text-slate-500 uppercase">Target: {data.target}</span>
                    </div>
                </div>

                <OptionRow data={data} isSolutionView={isSolutionView} />
            </div>
        </div>
    );
}

function PrimitiveGlyph({shape}: {shape: string}) {
    const normalized = shape.toLowerCase();
    const common = {fill: '#fcd34d', stroke: '#d97706', strokeWidth: 2};

    if (normalized.includes('triangle')) {
        return <svg width="28" height="24" viewBox="0 0 28 24"><polygon points="14,2 26,22 2,22" {...common} /></svg>;
    }
    if (normalized.includes('circle')) {
        return <svg width="28" height="24" viewBox="0 0 28 24"><path d="M 3 21 L 3 3 A 18 18 0 0 1 21 21 Z" {...common} /></svg>;
    }
    if (normalized.includes('cube')) {
        return (
            <svg width="28" height="24" viewBox="0 0 28 24">
                <path d="M 4 8 L 16 8 L 16 21 L 4 21 Z M 4 8 L 10 3 L 22 3 L 16 8 M 16 8 L 22 3 L 22 16 L 16 21" fill="#fef3c7" stroke="#d97706" strokeWidth="1.7" />
            </svg>
        );
    }
    if (normalized.includes('cone')) {
        return (
            <svg width="28" height="24" viewBox="0 0 28 24">
                <path d="M 14 2 L 4 19 Q 14 24 24 19 Z" {...common} />
                <ellipse cx="14" cy="19" rx="10" ry="3" fill="#fde68a" stroke="#d97706" strokeWidth="1.5" />
            </svg>
        );
    }
    if (normalized.includes('cylinder')) {
        return (
            <svg width="28" height="24" viewBox="0 0 28 24">
                <path d="M 5 6 V 18 C 5 22 23 22 23 18 V 6" fill="#fef3c7" stroke="#d97706" strokeWidth="1.7" />
                <ellipse cx="14" cy="6" rx="9" ry="3.5" {...common} />
            </svg>
        );
    }

    return (
        <svg width="28" height="24" viewBox="0 0 28 24">
            <path d="M 3 5 H 12 V 10 H 17 V 5 H 25 V 19 H 17 V 14 H 12 V 19 H 3 Z" {...common} />
        </svg>
    );
}

function PrimitiveToken({shape, count}: {shape: string; count: number}) {
    return (
        <div className="relative flex flex-col items-center justify-center w-[82px] h-[58px] rounded-lg border border-slate-200 bg-white px-1">
            {count > 1 && (
                <span className="absolute top-1 right-1 text-[0.68rem] font-bold text-amber-700">×{count}</span>
            )}
            <PrimitiveGlyph shape={shape} />
            <span className="text-[0.68rem] leading-tight text-center font-semibold text-slate-600">{shape}</span>
        </div>
    );
}

const groupInputs = (inputs: ShapeCompositionNode[]): Array<{shape: string; count: number}> => {
    const counts = new Map<string, number>();
    for (const input of inputs) counts.set(input.shape, (counts.get(input.shape) ?? 0) + 1);
    return [...counts].map(([shape, count]) => ({shape, count}));
};

const normalizedDiagramTarget = (shape: string): string | null => {
    if (SUPPORTED_TARGETS.includes(shape)) return shape;
    if (shape.includes('triangle')) return 'triangle';
    if (shape.includes('circle')) return 'quarter circle';
    if (shape.includes('cone')) return 'cone';
    if (shape.includes('cylinder')) return 'cylinder';
    if (shape.includes('cube')) return 'cube';
    return null;
};

function IntermediateDiagram({shape, componentShape, showSeams}: {shape: string; componentShape: string; showSeams: boolean}) {
    const normalizedTarget = normalizedDiagramTarget(shape);
    if (normalizedTarget) {
        return (
            <CompositionDiagram
                target={normalizedTarget}
                componentShape={componentShape}
                showSeams={showSeams}
                width={92}
                height={66}
            />
        );
    }

    return (
        <svg width="92" height="66" viewBox="0 0 92 66" role="img" aria-label={`${shape} intermediate diagram`}>
            <rect x="9" y="10" width="74" height="46" rx="8" fill="#f8fafc" stroke="#475569" strokeWidth="2.5" />
            {showSeams && <path d="M 46 10 V 56 M 9 33 H 83" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" />}
        </svg>
    );
}

function IntermediateCard({
    node,
    multiplicity,
    showSeams
}: {
    node: ShapeCompositionComposite;
    multiplicity: number;
    showSeams: boolean;
}) {
    return (
        <div className="relative flex items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-xl p-2.5 pt-8 min-w-[278px]">
            {multiplicity > 1 && (
                <span className="absolute top-2 right-2 rounded-full bg-blue-100 border border-blue-300 px-2 py-0.5 text-[0.72rem] font-bold text-blue-700">
                    ×{multiplicity} reused
                </span>
            )}
            <div className="flex gap-1.5">
                {groupInputs(node.inputs).map(group => (
                    <PrimitiveToken key={group.shape} shape={group.shape} count={group.count} />
                ))}
            </div>
            <span className="text-2xl font-bold text-blue-500" aria-hidden="true">→</span>
            <div className="flex flex-col items-center">
                <IntermediateDiagram shape={node.shape} componentShape={node.inputs[0].shape} showSeams={showSeams} />
                <span className="text-[0.7rem] font-bold text-blue-700">Intermediate piece</span>
                <span className="text-[0.68rem] text-slate-600">{node.shape}</span>
            </div>
        </div>
    );
}

const groupIntermediates = (
    intermediates: ShapeCompositionComposite[]
): Array<{node: ShapeCompositionComposite; multiplicity: number}> => {
    const groups = new Map<string, {node: ShapeCompositionComposite; multiplicity: number}>();
    for (const node of intermediates) {
        const key = JSON.stringify(node);
        const existing = groups.get(key);
        if (existing) existing.multiplicity += 1;
        else groups.set(key, {node, multiplicity: 1});
    }
    return [...groups.values()];
};

function MultiLevelLayout({data, isSolutionView}: {data: ShapeComposeShapesProblem; isSolutionView: boolean}) {
    const intermediates = data.compositionTree.inputs.filter(
        (input): input is ShapeCompositionComposite => input.kind === 'composite'
    );
    const intermediateGroups = groupIntermediates(intermediates);
    const promptText = `Which pieces can you build first, then join to make a ${data.target}?`;

    return (
        <div className="flex justify-center items-center p-[28px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[680px]">
                <div className="h-[58px] flex items-start justify-center text-[1.25rem] font-bold text-slate-700 text-center leading-normal">
                    {!isSolutionView && promptText}
                </div>

                <div className="flex items-stretch gap-3 w-full min-h-[310px] mb-5">
                    <section className="flex-1 border-2 border-blue-200 bg-blue-50 rounded-xl p-3">
                        <div className="text-[0.78rem] uppercase tracking-wide font-bold text-blue-700 mb-2 text-center">1. Make intermediate pieces</div>
                        <div className="flex flex-col items-center justify-center gap-2 h-[260px]">
                            {intermediateGroups.map(({node, multiplicity}) => (
                                <IntermediateCard
                                    key={JSON.stringify(node)}
                                    node={node}
                                    multiplicity={multiplicity}
                                    showSeams={isSolutionView}
                                />
                            ))}
                        </div>
                    </section>

                    <div className="flex flex-col items-center justify-center w-[46px] text-blue-600" aria-label="Reuse the intermediate pieces">
                        <span className="text-[0.68rem] uppercase font-bold [writing-mode:vertical-rl] rotate-180 mb-2">reuse</span>
                        <span className="text-4xl font-bold" aria-hidden="true">→</span>
                    </div>

                    <section className={`w-[245px] border-2 rounded-xl p-3 flex flex-col items-center ${isSolutionView ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                        <div className={`text-[0.78rem] uppercase tracking-wide font-bold mb-2 ${isSolutionView ? 'text-emerald-700' : 'text-slate-600'}`}>2. Build the final target</div>
                        <CompositionDiagram
                            target={data.target}
                            componentShape={data.compositionTree.inputs[0].shape}
                            showSeams={isSolutionView}
                            width={205}
                            height={154}
                        />
                        <span className="font-bold text-slate-600 uppercase text-[0.78rem]">Final: {data.target}</span>
                    </section>
                </div>

                <OptionRow data={data} isSolutionView={isSolutionView} />
            </div>
        </div>
    );
}

const ShapeComposeShapesCore = ({config: _config, payload}: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('shape-compose-shapes', data, [
        'target',
        'components',
        'options',
        'answer',
        'compositionTree',
        'compositionDepth'
    ]);
    validateComposition(data);

    return data.compositionDepth === 1
        ? <SingleLevelLayout data={data} isSolutionView={isSolutionView} />
        : <MultiLevelLayout data={data} isSolutionView={isSolutionView} />;
};

const SUPPORTED_TARGETS = [
    'rectangle', 'square', 'triangle', 'hexagon', 'trapezoid',
    'half circle', 'quarter circle', 'cube', 'rectangular prism', 'cone', 'cylinder'
];

interface DiagramProps {
    target: string;
    componentShape: string;
    showSeams: boolean;
    width?: number;
    height?: number;
}

const CompositionDiagram = ({target, componentShape, showSeams, width = 230, height = 160}: DiagramProps) => {
    const outline = {fill: '#f8fafc', stroke: '#475569', strokeWidth: 3};
    const seam = {stroke: '#ef4444', strokeWidth: 2.5, strokeDasharray: '5 4'};
    const normalizedComponent = componentShape.toLowerCase();
    const usesRectangularInputs = normalizedComponent.includes('rectangle') || normalizedComponent.includes('square');

    return (
        <svg width={width} height={height} viewBox="0 0 220 160" role="img" aria-label={`${target} composition diagram`}>
            {target === 'rectangle' && <>
                <rect x="35" y="40" width="150" height="90" rx="3" {...outline} />
                {showSeams && (usesRectangularInputs
                    ? <line x1="110" y1="40" x2="110" y2="130" {...seam} />
                    : <line x1="35" y1="40" x2="185" y2="130" {...seam} />)}
            </>}
            {target === 'square' && <>
                <rect x="60" y="25" width="110" height="110" rx="3" {...outline} />
                {showSeams && (usesRectangularInputs
                    ? <line x1="115" y1="25" x2="115" y2="135" {...seam} />
                    : <line x1="60" y1="25" x2="170" y2="135" {...seam} />)}
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
