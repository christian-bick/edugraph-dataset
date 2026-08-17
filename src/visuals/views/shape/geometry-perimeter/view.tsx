import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    FindMissingPolygonSideProblem,
    FindPolygonPerimeterProblem,
    PolygonVertex
} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    Grade4RectanglePerimeterProblem,
    isGrade4RectanglePerimeterProblem,
    isValidGrade4RectanglePerimeterProblem
} from './helpers.ts';
import {GeometryPerimeterViewConfig, GeometryPerimeterViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: GeometryPerimeterViewConfig;
    payload: ViewRenderPayload<'geometry-perimeter'>;
}

type ScreenVertex = PolygonVertex;

type LegacyGeometryPerimeterProblem = FindPolygonPerimeterProblem | FindMissingPolygonSideProblem;

function validatePerimeter(data: LegacyGeometryPerimeterProblem) {
    const expectedSideCounts = {triangle: 3, quadrilateral: 4, pentagon: 5, hexagon: 6};
    const sideCount = expectedSideCounts[data.shape];
    if (
        (data.task !== 'find-perimeter' && data.task !== 'find-missing-side')
        || data.unit !== 'units'
        || !sideCount
        || data.vertices.length !== sideCount
        || data.sideLengths.length !== sideCount
        || data.vertices.some(vertex => !Number.isFinite(vertex.x) || !Number.isFinite(vertex.y))
        || data.sideLengths.some(length => !Number.isInteger(length) || length <= 0)
        || data.perimeter !== data.sideLengths.reduce((sum, length) => sum + length, 0)
    ) {
        throw new ViewValidationError(
            'geometry-perimeter',
            'The polygon, side lengths, and perimeter total must be consistent.'
        );
    }
    if (data.task === 'find-missing-side' && (
        !Number.isInteger(data.unknownSideIndex)
        || data.unknownSideIndex < 0
        || data.unknownSideIndex >= sideCount
        || data.knownSideTotal !== data.perimeter - data.sideLengths[data.unknownSideIndex]
    )) {
        throw new ViewValidationError(
            'geometry-perimeter',
            'An inverse perimeter task must hide one valid side and total the remaining sides.'
        );
    }
}

function RectanglePerimeterDiagram({
    data,
    isSolutionView
}: {
    data: Grade4RectanglePerimeterProblem;
    isSolutionView: boolean;
}) {
    const isInverse = data.task === 'find-missing-perimeter-dimension';
    const lengthLabel = isInverse && data.unknownDimension === 'length' && !isSolutionView
        ? '? units'
        : `${data.length} units`;
    const widthLabel = isInverse && data.unknownDimension === 'width' && !isSolutionView
        ? '? units'
        : `${data.width} units`;
    const accessibleDescription = isInverse && !isSolutionView
        ? `Rectangle with known ${data.knownDimension} ${data.knownValue} units and unknown ${data.unknownDimension}`
        : `Rectangle with length ${data.length} units and width ${data.width} units`;

    return (
        <svg viewBox="0 0 560 270" className="h-[270px] w-[560px]" aria-label={accessibleDescription}>
            <rect x="112" y="42" width="336" height="178" rx="5" fill="#e0f2fe" stroke="#334155" strokeWidth="5" />
            {isSolutionView && (
                <rect x="112" y="42" width="336" height="178" rx="5" fill="none" stroke="#0f766e" strokeWidth="9" />
            )}
            <text x="280" y="31" textAnchor="middle" className="fill-slate-800 text-[16px] font-extrabold">{lengthLabel}</text>
            <text x="280" y="250" textAnchor="middle" className="fill-slate-800 text-[16px] font-extrabold">{lengthLabel}</text>
            <text x="75" y="132" textAnchor="middle" transform="rotate(-90 75 132)" className="fill-slate-800 text-[16px] font-extrabold">{widthLabel}</text>
            <text x="485" y="132" textAnchor="middle" transform="rotate(90 485 132)" className="fill-slate-800 text-[16px] font-extrabold">{widthLabel}</text>
            <text x="280" y="138" textAnchor="middle" className="fill-sky-900 text-[18px] font-extrabold">
                {isInverse ? `Perimeter: ${data.perimeter} units` : 'rectangle boundary'}
            </text>
        </svg>
    );
}

function RectanglePerimeterFormulaTask({
    data,
    isSolutionView
}: {
    data: Grade4RectanglePerimeterProblem;
    isSolutionView: boolean;
}) {
    const isInverse = data.task === 'find-missing-perimeter-dimension';
    return (
        <div className="w-[700px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="text-center text-[1.25rem] font-bold leading-snug text-slate-700">{data.prompt}</div>
            <div className="mt-4 flex justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <RectanglePerimeterDiagram data={data} isSolutionView={isSolutionView} />
            </div>
            <div className="mt-4 grid grid-cols-[355px_1fr] gap-3">
                <div className="flex items-center justify-center rounded-xl border-2 border-sky-200 bg-sky-50 px-2 py-3 text-center font-mono text-[0.78rem] font-extrabold whitespace-nowrap text-sky-900">
                    {data.formula}
                </div>
                <div className="flex min-h-[54px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-center font-mono text-[0.92rem] font-bold text-slate-700">
                    {data.questionEquation}
                </div>
            </div>
            {isInverse && !isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-center font-mono text-[1.02rem] font-bold text-blue-800">
                    Inverse step: {data.inverseEquation}
                </div>
            )}
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="font-mono text-[1.04rem] font-extrabold">{data.solutionEquation}</div>
                    <div className="mt-1 text-[1.05rem] font-extrabold">{data.answerStatement}</div>
                    <div className="mt-2 text-[0.92rem] font-semibold leading-snug text-slate-700">{data.explanation}</div>
                </div>
            )}
        </div>
    );
}

function fitVertices(vertices: PolygonVertex[]): ScreenVertex[] {
    const xs = vertices.map(vertex => vertex.x);
    const ys = vertices.map(vertex => vertex.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const scale = Math.min(310 / (maxX - minX), 190 / (maxY - minY));
    const width = (maxX - minX) * scale;
    const height = (maxY - minY) * scale;
    const offsetX = (560 - width) / 2;
    const offsetY = (270 - height) / 2;

    return vertices.map(vertex => ({
        x: offsetX + (vertex.x - minX) * scale,
        y: offsetY + (vertex.y - minY) * scale
    }));
}

function labelPosition(start: ScreenVertex, end: ScreenVertex, center: ScreenVertex) {
    const midpoint = {x: (start.x + end.x) / 2, y: (start.y + end.y) / 2};
    const dx = midpoint.x - center.x;
    const dy = midpoint.y - center.y;
    const distance = Math.hypot(dx, dy) || 1;
    return {
        x: midpoint.x + dx / distance * 28,
        y: midpoint.y + dy / distance * 28 + 5
    };
}

function PolygonDiagram({data, traceBoundary, hideUnknown}: {
    data: LegacyGeometryPerimeterProblem;
    traceBoundary: boolean;
    hideUnknown: boolean;
}) {
    const vertices = fitVertices(data.vertices);
    const center = {
        x: vertices.reduce((sum, vertex) => sum + vertex.x, 0) / vertices.length,
        y: vertices.reduce((sum, vertex) => sum + vertex.y, 0) / vertices.length
    };
    const points = vertices.map(vertex => `${vertex.x},${vertex.y}`).join(' ');

    return (
        <svg
            viewBox="0 0 560 270"
            className="h-[270px] w-[560px]"
            aria-label={`A closed ${data.shape} with every side length labeled`}
        >
            <polygon
                points={points}
                fill="#e2e8f0"
                stroke="#334155"
                strokeWidth="5"
                strokeLinejoin="round"
            />
            {traceBoundary && (
                <polygon
                    points={points}
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth="8"
                    strokeLinejoin="round"
                    opacity="0.9"
                />
            )}
            {vertices.map((start, index) => {
                const end = vertices[(index + 1) % vertices.length];
                const position = labelPosition(start, end, center);
                return (
                    <g key={index}>
                        <rect
                            x={position.x - 34}
                            y={position.y - 17}
                            width="68"
                            height="24"
                            rx="8"
                            fill="white"
                            stroke="#cbd5e1"
                        />
                        <text
                            x={position.x}
                            y={position.y}
                            textAnchor="middle"
                            className="fill-slate-800 text-[14px] font-extrabold"
                        >
                            {hideUnknown
                                && data.task === 'find-missing-side'
                                && index === data.unknownSideIndex
                                ? '? units'
                                : `${data.sideLengths[index]} units`}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

const GeometryPerimeterCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('geometry-perimeter', data, [
        'task',
        'shape',
        'vertices',
        'sideLengths',
        'perimeter',
        'unit'
    ]);
    if (isGrade4RectanglePerimeterProblem(data)) {
        validateProblemData('geometry-perimeter', data, [
            'length',
            'width',
            'formula',
            'prompt',
            'questionEquation',
            'solutionEquation',
            'answerStatement',
            'explanation'
        ]);
        if (data.task === 'find-missing-perimeter-dimension') {
            validateProblemData('geometry-perimeter', data, [
                'unknownDimension',
                'knownDimension',
                'knownValue',
                'missingValue',
                'knownSideTotal',
                'inverseEquation'
            ]);
        }
        if (!isValidGrade4RectanglePerimeterProblem(data)) {
            throw new ViewValidationError(
                'geometry-perimeter',
                'The rectangle dimensions, perimeter formula, and supplied equations must be consistent.'
            );
        }
        return <RectanglePerimeterFormulaTask data={data} isSolutionView={isSolutionView} />;
    }
    validatePerimeter(data);
    const addition = data.sideLengths.join(' + ');
    const isInverse = data.task === 'find-missing-side';
    const knownAddition = isInverse
        ? data.sideLengths
            .filter((_, index) => index !== data.unknownSideIndex)
            .join(' + ')
        : '';
    const missingSide = isInverse ? data.sideLengths[data.unknownSideIndex] : 0;

    return (
        <div className="w-[700px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="text-center text-[1.3rem] font-bold text-slate-700">
                {isInverse
                    ? `The perimeter is ${data.perimeter} ${data.unit}. Find the missing side length.`
                    : `Find the perimeter of the ${data.shape}.`}
            </div>
            <div className="mt-4 flex justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <PolygonDiagram
                    data={data}
                    traceBoundary={isSolutionView}
                    hideUnknown={isInverse && !isSolutionView}
                />
            </div>
            <div className={`mt-4 min-h-[62px] rounded-xl border-2 px-5 py-3 text-center font-mono ${
                isInverse ? 'text-[1rem]' : 'text-[1.15rem]'
            } font-bold ${
                isSolutionView
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-600'
            }`}>
                {isSolutionView
                    ? isInverse
                        ? `Missing side = ${data.perimeter} - (${knownAddition}) = ${missingSide} ${data.unit}`
                        : `Perimeter = ${addition} = ${data.perimeter} ${data.unit}`
                    : isInverse
                        ? `Known sides total ${data.knownSideTotal} ${data.unit}.`
                        : `Add the lengths of all ${data.sideLengths.length} sides.`}
            </div>
        </div>
    );
};

export const GeometryPerimeter = withConfig(
    GeometryPerimeterViewSchema,
    GeometryPerimeterCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'geometry-perimeter'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<GeometryPerimeter payload={payload} />);
};
