import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeCountAttribute, ShapeDefinition} from '../../../../types/problems.ts';
import {ShapeBuildShapeViewConfig, ShapeBuildShapeViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {angleConstructionMatchesRenderedPolygon, shapeConstructionCountsMatch} from '../helpers.ts';
import '../../../../tailwind.css';

function interiorAngleMarker(
    vertex: {x: number; y: number},
    previous: {x: number; y: number},
    next: {x: number; y: number}
) {
    const pointOnRay = (end: {x: number; y: number}, distance: number) => {
        const dx = end.x - vertex.x;
        const dy = end.y - vertex.y;
        const length = Math.hypot(dx, dy);
        return {x: vertex.x + dx / length * distance, y: vertex.y + dy / length * distance};
    };
    const start = pointOnRay(previous, 13);
    const end = pointOnRay(next, 13);
    const centroidDirection = {
        x: (previous.x + next.x) / 2,
        y: (previous.y + next.y) / 2
    };
    const label = pointOnRay(centroidDirection, 19);
    return {
        path: `M ${start.x} ${start.y} Q ${vertex.x} ${vertex.y} ${end.x} ${end.y}`,
        label
    };
}

function verticesForShape(shape: string): Array<{x: number; y: number}> {
    let vertices: Array<{ x: number; y: number }> = [];

    if (shape === 'square') {
        vertices = [{ x: 15, y: 15 }, { x: 85, y: 15 }, { x: 85, y: 85 }, { x: 15, y: 85 }];
    } else if (shape === 'rectangle') {
        vertices = [{ x: 10, y: 25 }, { x: 90, y: 25 }, { x: 90, y: 75 }, { x: 10, y: 75 }];
    } else if (shape === 'triangle') {
        vertices = [{ x: 50, y: 15 }, { x: 85, y: 85 }, { x: 15, y: 85 }];
    } else if (shape === 'quadrilateral') {
        vertices = [{ x: 18, y: 18 }, { x: 87, y: 12 }, { x: 75, y: 88 }, { x: 10, y: 72 }];
    } else if (shape === 'pentagon') {
        vertices = [{ x: 50, y: 8 }, { x: 90, y: 38 }, { x: 75, y: 88 }, { x: 25, y: 88 }, { x: 10, y: 38 }];
    } else if (shape === 'hexagon') {
        vertices = [
            { x: 50, y: 10 }, { x: 85, y: 30 }, { x: 85, y: 70 },
            { x: 50, y: 90 }, { x: 15, y: 70 }, { x: 15, y: 30 }
        ];
    } else {
        throw new ViewValidationError('shape-build-shape', `Unsupported shape: ${shape}`);
    }

    return vertices;
}

function ShapeSVG({
    shape,
    size = 100,
    solved = false,
    markAngles = false
}: {
    shape: string;
    size?: number;
    solved?: boolean;
    markAngles?: boolean;
}) {
    const vertices = verticesForShape(shape);

    const pointsStr = vertices.map(v => `${v.x},${v.y}`).join(' ');

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className="overflow-visible"
            aria-label={markAngles ? `${vertices.length} marked interior angles` : undefined}
        >
            {/* Sticks (sides) */}
            <polygon points={pointsStr} fill="none" stroke={solved ? 'forestgreen' : '#64748b'} strokeWidth="5" strokeLinejoin="miter" />
            {/* Clay balls (corners) */}
            {!markAngles && vertices.map((v, i) => (
                <circle key={i} cx={v.x} cy={v.y} r="7" fill={solved ? '#dcfce7' : '#e11d48'} stroke={solved ? 'forestgreen' : '#be123c'} strokeWidth="1.5" />
            ))}
            {markAngles && vertices.map((vertex, index) => {
                const marker = interiorAngleMarker(
                    vertex,
                    vertices[(index - 1 + vertices.length) % vertices.length],
                    vertices[(index + 1) % vertices.length]
                );
                return (
                    <g key={index}>
                        <path
                            d={marker.path}
                            fill="none"
                            stroke="#ea580c"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                        <text
                            x={marker.label.x}
                            y={marker.label.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#9a3412"
                            fontSize="8"
                            fontWeight="800"
                        >
                            {index + 1}
                        </text>
                    </g>
                );
            })}
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

function LoosePartsAssemblyLayout({
    target,
    sides,
    corners,
    isSolutionView
}: {
    target: string;
    sides: number;
    corners: number;
    isSolutionView: boolean;
}) {
    return (
        <div className="flex w-fit items-center justify-center rounded-2xl bg-white p-[30px] font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex w-[620px] flex-col items-center gap-5">
                <div className="text-center text-[1.3rem] font-bold leading-normal text-slate-700">
                    {isSolutionView
                        ? `${target[0].toUpperCase()}${target.slice(1)} built from ${sides} sticks and ${corners} corners`
                        : `Use the loose sticks and corners to build a ${target}.`}
                </div>
                <div className="grid w-full grid-cols-2 gap-4">
                    <div className="flex h-[250px] flex-col items-center justify-center rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                        <div className="mb-5 text-sm font-extrabold uppercase tracking-wide text-amber-800">
                            {isSolutionView ? 'Parts used' : 'Loose parts'}
                        </div>
                        {isSolutionView
                            ? (
                                <div className="flex flex-col items-center gap-3 text-center font-bold text-emerald-700">
                                    <span className="text-4xl">✓</span>
                                    <span>All {sides} sticks and {corners} corners</span>
                                </div>
                            )
                            : <MaterialTray sides={sides} corners={corners} />}
                    </div>
                    <div className="flex h-[250px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
                        <div className="mb-3 text-sm font-extrabold uppercase tracking-wide text-slate-500">Assembly area</div>
                        {isSolutionView
                            ? <ShapeSVG shape={target} size={175} solved />
                            : <div className="flex h-[175px] items-center text-lg font-bold text-slate-400">Build here</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function EqualFaceMaterials({assembled}: {assembled: boolean}) {
    if (!assembled) {
        return (
            <div className="grid grid-cols-3 gap-3" aria-label="Six equal square faces">
                {Array.from({length: 6}, (_, index) => (
                    <div key={index} className="w-[52px] h-[52px] bg-blue-100 border-2 border-blue-500 rounded-sm" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-7" aria-label="A cube and its six equal square faces">
            <svg width="125" height="125" viewBox="0 0 120 120">
                <polygon points="28,35 68,17 101,38 61,57" fill="#dbeafe" stroke="forestgreen" strokeWidth="3" />
                <polygon points="28,35 61,57 61,101 28,78" fill="#bfdbfe" stroke="forestgreen" strokeWidth="3" />
                <polygon points="61,57 101,38 101,82 61,101" fill="#93c5fd" stroke="forestgreen" strokeWidth="3" />
            </svg>
            <svg width="150" height="118" viewBox="0 0 150 118">
                {[
                    [51, 3], [51, 31], [23, 59], [51, 59], [79, 59], [51, 87]
                ].map(([x, y], index) => (
                    <rect key={index} x={x} y={y} width="28" height="28" fill="#dcfce7" stroke="forestgreen" strokeWidth="2" />
                ))}
            </svg>
        </div>
    );
}

function CountRequirementCard({attribute, requiredCount}: {attribute: ShapeCountAttribute; requiredCount: number}) {
    const text = attribute === 'vertices'
        ? `${requiredCount} vertices`
        : attribute === 'angles'
            ? `${requiredCount} angles`
            : `${requiredCount} equal square faces`;
    return (
        <div className="w-[420px] bg-blue-50 border-2 border-blue-200 rounded-xl px-5 py-3 text-center box-border">
            <div className="text-[0.82rem] font-bold uppercase tracking-wide text-blue-700 mb-1">Required attribute</div>
            <div className="text-[1.15rem] font-bold text-slate-700">{text}</div>
        </div>
    );
}

function AngleDrawingCanvas() {
    return (
        <div className="flex h-[170px] w-[330px] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white text-base font-semibold text-slate-400">
            Draw your shape here
        </div>
    );
}

function AngleCountSolution({target, requiredCount}: {target: string; requiredCount: number}) {
    return (
        <div className="flex flex-col items-center gap-3">
            <ShapeSVG shape={target} size={165} solved markAngles />
            <div className="rounded-full border-2 border-orange-300 bg-orange-50 px-4 py-1.5 text-base font-extrabold text-orange-800">
                {requiredCount} angles counted
            </div>
        </div>
    );
}

function CountSpecificationLayout({
    target,
    sides,
    corners,
    attribute,
    requiredCount,
    isSolutionView
}: {
    target: string;
    sides: number;
    corners: number;
    attribute: ShapeCountAttribute;
    requiredCount: number;
    isSolutionView: boolean;
}) {
    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px] gap-5">
                <div className="h-[42px] flex items-start justify-center text-[1.25rem] font-bold text-slate-700 text-center leading-normal">
                    {attribute === 'angles'
                        ? isSolutionView
                            ? `A shape with ${requiredCount} angles`
                            : `Draw a shape with ${requiredCount} angles.`
                        : !isSolutionView && 'Draw a shape with the required attribute.'}
                </div>
                <CountRequirementCard attribute={attribute} requiredCount={requiredCount} />
                <div className="flex justify-center items-center w-[420px] h-[230px] bg-slate-50 border-2 border-slate-200 rounded-xl p-[15px] box-border">
                    {attribute === 'vertices'
                        ? isSolutionView
                            ? <ShapeSVG shape={target} size={155} solved />
                            : <MaterialTray sides={sides} corners={corners} />
                        : attribute === 'angles'
                            ? isSolutionView
                                ? <AngleCountSolution target={target} requiredCount={requiredCount} />
                                : <AngleDrawingCanvas />
                            : <EqualFaceMaterials assembled={isSolutionView} />}
                </div>
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

const ShapeBuildShapeCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    validateProblemData('shape-build-shape', problem.data, ['target', 'sides', 'corners']);
    const data = problem.data;
    const {target, sides, corners} = data;

    if (!shapeConstructionCountsMatch(target, sides, corners)) {
        throw new ViewValidationError('shape-build-shape', 'The construction counts do not match the named shape.');
    }

    if (config.useGeometrySticks !== (data.task === 'assemble-from-parts')) {
        throw new ViewValidationError(
            'shape-build-shape',
            'The geometry-stick representation must agree with the loose-part assembly task.'
        );
    }

    if (data.task === 'assemble-from-parts') {
        if (!['triangle', 'square', 'rectangle', 'hexagon'].includes(target)) {
            throw new ViewValidationError('shape-build-shape', 'Loose-part assembly requires a supported polygon.');
        }
        return (
            <LoosePartsAssemblyLayout
                target={target}
                sides={sides}
                corners={corners}
                isSolutionView={isSolutionView}
            />
        );
    }

    if (data.task === 'specify-count') {
        validateProblemData('shape-build-shape', data, ['task', 'attribute', 'requiredCount']);
        if (data.attribute === 'vertices' && corners !== data.requiredCount) {
            throw new ViewValidationError('shape-build-shape', 'Vertex materials must match the required count.');
        }
        if (data.attribute === 'angles' && !angleConstructionMatchesRenderedPolygon(
            data,
            verticesForShape(target).length
        )) {
            throw new ViewValidationError('shape-build-shape', 'The polygon must match the required angle count.');
        }
        if (data.attribute === 'equal-faces' && (target !== 'cube' || data.requiredCount !== 6)) {
            throw new ViewValidationError('shape-build-shape', 'Equal-face construction requires a six-faced cube.');
        }
        return (
            <CountSpecificationLayout
                target={target}
                sides={sides}
                corners={corners}
                attribute={data.attribute}
                requiredCount={data.requiredCount}
                isSolutionView={isSolutionView}
            />
        );
    }

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

    if (data.task !== undefined) {
        throw new ViewValidationError('shape-build-shape', `Unsupported construction task: ${data.task}`);
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
