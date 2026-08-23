import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {
    GeometryPerimeterProblem,
    PolygonPerimeterProblem,
    PolygonVertex
} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    Grade4RectanglePerimeterProblem,
    RectanglePerimeterProjection,
    isGrade4RectanglePerimeterProblem,
    isValidGrade4RectanglePerimeterProblem,
    projectRectanglePerimeter,
    projectUnknownSideIndex
} from './geometry-perimeter-helpers.ts';

export type GeometryPerimeterMode = 'execution' | 'inversion';

interface GeometryPerimeterViewProps {
    mode: GeometryPerimeterMode;
    payload: RenderPayload<AbstractProblem<GeometryPerimeterProblem>>;
    viewId: string;
}

type ScreenVertex = PolygonVertex;

type LegacyGeometryPerimeterProblem = PolygonPerimeterProblem;

function validatePerimeter(viewId: string, data: LegacyGeometryPerimeterProblem) {
    const expectedSideCounts = {triangle: 3, quadrilateral: 4, pentagon: 5, hexagon: 6};
    const sideCount = expectedSideCounts[data.shape];
    if (
        !sideCount
        || data.vertices.length !== sideCount
        || data.sideLengths.length !== sideCount
        || data.vertices.some(vertex => !Number.isFinite(vertex.x) || !Number.isFinite(vertex.y))
        || data.sideLengths.some(length => !Number.isInteger(length) || length <= 0)
        || data.perimeter !== data.sideLengths.reduce((sum, length) => sum + length, 0)
    ) {
        throw new ViewValidationError(
            viewId,
            'The polygon, side lengths, and perimeter total must be consistent.'
        );
    }
}

function RectanglePerimeterDiagram({
    data,
    projection,
    isSolutionView,
    isInverse
}: {
    data: Grade4RectanglePerimeterProblem;
    projection: RectanglePerimeterProjection;
    isSolutionView: boolean;
    isInverse: boolean;
}) {
    const lengthLabel = isInverse && projection.unknownDimension === 'length' && !isSolutionView
        ? '? units'
        : `${data.length} units`;
    const widthLabel = isInverse && projection.unknownDimension === 'width' && !isSolutionView
        ? '? units'
        : `${data.width} units`;
    const accessibleDescription = isInverse && !isSolutionView
        ? `Rectangle with known ${projection.knownDimension} ${projection.knownValue} units and unknown ${projection.unknownDimension}`
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
    projection,
    isSolutionView,
    isInverse
}: {
    data: Grade4RectanglePerimeterProblem;
    projection: RectanglePerimeterProjection;
    isSolutionView: boolean;
    isInverse: boolean;
}) {
    const prompt = isInverse
        ? `A rectangle has a perimeter of ${data.perimeter} units and a ${projection.knownDimension} of ${projection.knownValue} units. Find its ${projection.unknownDimension}.`
        : `Find the perimeter of a rectangle with length ${data.length} units and width ${data.width} units.`;
    const questionEquation = isInverse
        ? projection.unknownDimension === 'length'
            ? `P = ? + ${data.width} + ? + ${data.width} = ${data.perimeter}`
            : `P = ${data.length} + ? + ${data.length} + ? = ${data.perimeter}`
        : `P = ${data.length} + ${data.width} + ${data.length} + ${data.width} = ?`;
    const inverseEquation = `(${data.perimeter} - ${projection.knownSideTotal}) ÷ 2 = ?`;
    const solutionEquation = isInverse
        ? `(${data.perimeter} - ${projection.knownSideTotal}) ÷ 2 = ${projection.missingValue}`
        : `P = ${data.length} + ${data.width} + ${data.length} + ${data.width} = ${data.perimeter}`;
    const answerStatement = isInverse
        ? `The ${projection.unknownDimension} is ${projection.missingValue} units.`
        : `The perimeter is ${data.perimeter} units.`;
    const explanation = isInverse
        ? `The two known ${projection.knownDimension} sides total ${projection.knownSideTotal} units. Subtract them from ${data.perimeter}, then divide the remaining length equally between the two ${projection.unknownDimension} sides to get ${projection.missingValue} units.`
        : `A rectangle has two lengths and two widths. Add ${data.length} + ${data.width} + ${data.length} + ${data.width} to get ${data.perimeter} units.`;
    return (
        <div className="w-[700px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="text-center text-[1.25rem] font-bold leading-snug text-slate-700">{prompt}</div>
            <div className="mt-4 flex justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <RectanglePerimeterDiagram data={data} projection={projection} isSolutionView={isSolutionView} isInverse={isInverse} />
            </div>
            <div className="mt-4 grid grid-cols-[355px_1fr] gap-3">
                <div className="flex items-center justify-center rounded-xl border-2 border-sky-200 bg-sky-50 px-2 py-3 text-center font-mono text-[0.78rem] font-extrabold whitespace-nowrap text-sky-900">
                    P = length + width + length + width
                </div>
                <div className="flex min-h-[54px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-center font-mono text-[0.92rem] font-bold text-slate-700">
                    {questionEquation}
                </div>
            </div>
            {isInverse && !isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-center font-mono text-[1.02rem] font-bold text-blue-800">
                    Inverse step: {inverseEquation}
                </div>
            )}
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="font-mono text-[1.04rem] font-extrabold">{solutionEquation}</div>
                    <div className="mt-1 text-[1.05rem] font-extrabold">{answerStatement}</div>
                    <div className="mt-2 text-[0.92rem] font-semibold leading-snug text-slate-700">{explanation}</div>
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

function PolygonDiagram({data, unknownSideIndex, traceBoundary, hideUnknown}: {
    data: LegacyGeometryPerimeterProblem;
    unknownSideIndex: number;
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
                            {hideUnknown && index === unknownSideIndex
                                ? '? units'
                                : `${data.sideLengths[index]} units`}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export const GeometryPerimeterView = ({
    mode,
    payload,
    viewId
}: GeometryPerimeterViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(viewId, data, [
        'shape',
        'perimeter'
    ]);
    const isInverse = mode === 'inversion';
    if (isGrade4RectanglePerimeterProblem(data)) {
        validateProblemData(viewId, data, [
            'length',
            'width'
        ]);
        if (!isValidGrade4RectanglePerimeterProblem(data)) {
            throw new ViewValidationError(
                viewId,
                'The rectangle dimensions, perimeter formula, and supplied equations must be consistent.'
            );
        }
        const projection = projectRectanglePerimeter(data, payload.seed);
        return <RectanglePerimeterFormulaTask data={data} projection={projection} isSolutionView={isSolutionView} isInverse={isInverse} />;
    }
    validateProblemData(viewId, data, ['vertices', 'sideLengths']);
    validatePerimeter(viewId, data);
    const unknownSideIndex = projectUnknownSideIndex(data.sideLengths.length, payload.seed);
    const addition = data.sideLengths.join(' + ');
    const knownAddition = isInverse
        ? data.sideLengths
            .filter((_, index) => index !== unknownSideIndex)
            .join(' + ')
        : '';
    const missingSide = isInverse ? data.sideLengths[unknownSideIndex] : 0;
    const knownSideTotal = data.perimeter - data.sideLengths[unknownSideIndex];

    return (
        <div className="w-[700px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="text-center text-[1.3rem] font-bold text-slate-700">
                {isInverse
                    ? `The perimeter is ${data.perimeter} units. Find the missing side length.`
                    : `Find the perimeter of the ${data.shape}.`}
            </div>
            <div className="mt-4 flex justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <PolygonDiagram
                    data={data}
                    unknownSideIndex={unknownSideIndex}
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
                        ? `Missing side = ${data.perimeter} - (${knownAddition}) = ${missingSide} units`
                        : `Perimeter = ${addition} = ${data.perimeter} units`
                    : isInverse
                        ? `Known sides total ${knownSideTotal} units.`
                        : `Add the lengths of all ${data.sideLengths.length} sides.`}
            </div>
        </div>
    );
};
