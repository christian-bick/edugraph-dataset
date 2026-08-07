import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeDefinition} from '../../../../types/problems.ts';
import {ShapeBuildShapeViewConfig, ShapeBuildShapeViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

function ShapeSVG({shape, size = 100, solved = false}: {shape: string; size?: number; solved?: boolean}) {
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
            <polygon points={pointsStr} fill="none" stroke={solved ? 'forestgreen' : '#64748b'} strokeWidth="5" strokeLinejoin="miter" />
            {/* Clay balls (corners) */}
            {vertices.map((v, i) => (
                <circle key={i} cx={v.x} cy={v.y} r="7" fill={solved ? '#dcfce7' : '#e11d48'} stroke={solved ? 'forestgreen' : '#be123c'} strokeWidth="1.5" />
            ))}
        </svg>
    );
}

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
        throw new ViewValidationError('shape-build-shape', 'The defining-attribute payload is invalid.');
    }
}

function DefinitionCard({definition}: {definition: ShapeDefinition}) {
    return (
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
    );
}

function MaterialTray({sides, corners}: {sides: number; corners: number}) {
    return (
        <div className="flex flex-col items-center justify-center gap-6" aria-label="Unassembled construction materials">
            <div className="flex flex-wrap justify-center gap-2 max-w-[270px]">
                {Array.from({length: sides}, (_, index) => (
                    <span
                        key={`stick-${index}`}
                        className="block w-[58px] h-[6px] rounded-full bg-slate-500"
                        style={{transform: `rotate(${index % 2 === 0 ? -7 : 8}deg)`}}
                    />
                ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3 max-w-[220px]">
                {Array.from({length: corners}, (_, index) => (
                    <span key={`corner-${index}`} className="block w-[18px] h-[18px] rounded-full bg-rose-600 border border-rose-700" />
                ))}
            </div>
        </div>
    );
}

function AttributeSpecificationLayout({
    target,
    sides,
    corners,
    definition,
    isSolutionView
}: {
    target: string;
    sides: number;
    corners: number;
    definition: ShapeDefinition;
    isSolutionView: boolean;
}) {
    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px] gap-5">
                <div className="h-[42px] flex items-start justify-center text-[1.25rem] font-bold text-slate-700 text-center leading-normal">
                    {!isSolutionView && 'Build a shape with these defining attributes.'}
                </div>
                <DefinitionCard definition={definition} />
                <div className="flex justify-center items-center w-[420px] h-[230px] bg-slate-50 border-2 border-slate-200 rounded-xl p-[15px] box-border">
                    {isSolutionView
                        ? <ShapeSVG shape={target} size={145} solved />
                        : <MaterialTray sides={sides} corners={corners} />}
                </div>
            </div>
        </div>
    );
}

interface CoreProps {
    config: ShapeBuildShapeViewConfig;
    payload: ViewRenderPayload<'shape-build-shape'>;
}

const ShapeBuildShapeCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    validateProblemData('shape-build-shape', problem.data, ['target', 'sides', 'corners']);
    const data = problem.data;
    const {target, sides, corners} = data;

    if (data.task === 'specify-attributes') {
        validateProblemData('shape-build-shape', data, ['task', 'definition']);
        validateDefinition(data.definition);
        return (
            <AttributeSpecificationLayout
                target={target}
                sides={sides}
                corners={corners}
                definition={data.definition}
                isSolutionView={isSolutionView}
            />
        );
    }

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
