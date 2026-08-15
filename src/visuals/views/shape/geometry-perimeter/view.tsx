import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {GeometryPerimeterProblem, PolygonVertex} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {GeometryPerimeterViewConfig, GeometryPerimeterViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: GeometryPerimeterViewConfig;
    payload: ViewRenderPayload<'geometry-perimeter'>;
}

type ScreenVertex = PolygonVertex;

function validatePerimeter(data: GeometryPerimeterProblem) {
    validateProblemData('geometry-perimeter', data, [
        'task',
        'shape',
        'vertices',
        'sideLengths',
        'perimeter',
        'unit'
    ]);
    const expectedSideCounts = {triangle: 3, quadrilateral: 4, pentagon: 5, hexagon: 6};
    const sideCount = expectedSideCounts[data.shape];
    if (
        data.task !== 'find-perimeter'
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

function PolygonDiagram({data, traceBoundary}: {
    data: GeometryPerimeterProblem;
    traceBoundary: boolean;
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
                            {data.sideLengths[index]} units
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
    validatePerimeter(data);
    const addition = data.sideLengths.join(' + ');

    return (
        <div className="w-[700px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="text-center text-[1.3rem] font-bold text-slate-700">
                Find the perimeter of the {data.shape}.
            </div>
            <div className="mt-4 flex justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <PolygonDiagram data={data} traceBoundary={isSolutionView} />
            </div>
            <div className={`mt-4 min-h-[62px] rounded-xl border-2 px-5 py-3 text-center font-mono text-[1.15rem] font-bold ${
                isSolutionView
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-600'
            }`}>
                {isSolutionView
                    ? `Perimeter = ${addition} = ${data.perimeter} ${data.unit}`
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
