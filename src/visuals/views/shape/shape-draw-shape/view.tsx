import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeDefinition} from '../../../../types/problems.ts';
import {getTracePath} from './helpers.ts';
import {ShapeDrawShapeViewConfig, ShapeDrawShapeViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeDrawShapeViewConfig;
    payload: ViewRenderPayload<'shape-draw-shape'>;
}

const SUPPORTED_SHAPES = ['circle', 'triangle', 'square', 'rectangle'] as const;

const ensureSupportedShape = (shape: string) => {
    if (!(SUPPORTED_SHAPES as readonly string[]).includes(shape)) {
        throw new ViewValidationError('shape-draw-shape', `Unsupported shape: ${shape}`);
    }
};

function definitionLines(definition: ShapeDefinition): string[] {
    const lines = [
        'Closed shape',
        definition.boundary === 'curved'
            ? 'One curved boundary'
            : `${definition.sideCount} straight sides`,
        `${definition.vertexCount} vertices`
    ];
    if (definition.equalSides) lines.push('All sides have equal length');
    if (definition.rightAngleCount !== undefined) lines.push(`${definition.rightAngleCount} right angles`);
    return lines;
}

function validateDefinition(definition: ShapeDefinition) {
    const validBoundary = definition.boundary === 'curved' || definition.boundary === 'straight';
    if (
        definition.closed !== true
        || !validBoundary
        || !Number.isInteger(definition.sideCount)
        || !Number.isInteger(definition.vertexCount)
    ) {
        throw new ViewValidationError('shape-draw-shape', 'The defining-attribute payload is invalid.');
    }
}

function SpecificationDrawingLayout({
    shape,
    definition,
    isSolutionView
}: {
    shape: string;
    definition: ShapeDefinition;
    isSolutionView: boolean;
}) {
    const pathD = getTracePath(shape);
    if (pathD.length === 0) {
        throw new ViewValidationError('shape-draw-shape', `No drawing path for shape: ${shape}`);
    }

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit mx-auto font-sans">
            <div className="flex flex-col items-center w-[480px] gap-5">
                <div className="h-[42px] flex items-start justify-center text-[1.25rem] font-bold text-slate-700 text-center leading-normal">
                    {!isSolutionView && 'Draw a shape with these defining attributes.'}
                </div>
                <div className="w-[420px] min-h-[112px] bg-blue-50 border-2 border-blue-200 rounded-xl px-5 py-3 box-border">
                    <div className="text-[0.82rem] font-bold uppercase tracking-wide text-blue-700 mb-2">Defining attributes</div>
                    <div className="flex flex-wrap gap-2">
                        {definitionLines(definition).map(line => (
                            <span key={line} className="bg-white border border-blue-200 rounded-full px-3 py-1 text-[0.92rem] font-semibold text-slate-700">
                                {line}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center items-center w-[420px] h-[230px] bg-slate-50 border-2 border-slate-200 rounded-xl p-[15px] box-border">
                    <svg width="160" height="160" viewBox="0 0 100 100" className="overflow-visible">
                        {isSolutionView && (
                            <path d={pathD} fill="none" stroke="forestgreen" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                    </svg>
                </div>
            </div>
        </div>
    );
}

function LegacyDrawingLayout({shape, isSolutionView}: {shape: string; isSolutionView: boolean}) {
    const promptText = `Draw the ${shape} by following the guide.`;
    const pathD = getTracePath(shape);

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit mx-auto font-sans">
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
}

const ShapeDrawShapeCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('shape-draw-shape', data, []);

    if ('target' in data) {
        validateProblemData('shape-draw-shape', data, ['target', 'sides', 'corners']);
        ensureSupportedShape(data.target);
        if (data.task === 'specify-attributes') {
            validateProblemData('shape-draw-shape', data, ['task', 'definition']);
            validateDefinition(data.definition);
            return (
                <SpecificationDrawingLayout
                    shape={data.target}
                    definition={data.definition}
                    isSolutionView={isSolutionView}
                />
            );
        }
        return <LegacyDrawingLayout shape={data.target} isSolutionView={isSolutionView} />;
    }

    validateProblemData('shape-draw-shape', data, ['shape', 'answer']);
    ensureSupportedShape(data.shape);
    return <LegacyDrawingLayout shape={data.shape} isSolutionView={isSolutionView} />;
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
