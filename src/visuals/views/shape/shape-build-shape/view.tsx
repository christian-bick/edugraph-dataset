import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeCountAttribute, ShapeDefinition} from '../../../../types/problems.ts';
import {ShapeBuildShapeViewConfig, ShapeBuildShapeViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {angleConstructionMatchesRenderedPolygon, shapeConstructionCountsMatch} from '../helpers.ts';
import {MaterialTray, ShapeSVG, verticesForShape} from '../shape-construction-components.tsx';
import '../../../../tailwind.css';

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
            <ShapeSVG viewId="shape-build-shape" shape={target} size={165} solved markAngles />
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
                            ? <ShapeSVG viewId="shape-build-shape" shape={target} size={155} solved />
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
                        ? <ShapeSVG viewId="shape-build-shape" shape={target} size={145} solved />
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

const ShapeBuildShapeCore = ({ payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    validateProblemData('shape-build-shape', problem.data, ['target', 'sides', 'corners']);
    const data = problem.data;
    const {target, sides, corners} = data;

    if (!shapeConstructionCountsMatch(target, sides, corners)) {
        throw new ViewValidationError('shape-build-shape', 'The construction counts do not match the named shape.');
    }

    if (data.task === 'specify-count') {
        validateProblemData('shape-build-shape', data, ['task', 'attribute', 'requiredCount']);
        if (data.attribute === 'vertices' && corners !== data.requiredCount) {
            throw new ViewValidationError('shape-build-shape', 'Vertex materials must match the required count.');
        }
        if (data.attribute === 'angles' && !angleConstructionMatchesRenderedPolygon(
            data,
            verticesForShape(target, 'shape-build-shape').length
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

    throw new ViewValidationError('shape-build-shape', `Unsupported construction task: ${data.task}`);
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
