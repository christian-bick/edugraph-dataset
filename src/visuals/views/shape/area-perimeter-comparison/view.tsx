import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {AreaPerimeterRelationProblem, RectangleMeasures} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    AreaPerimeterComparisonViewConfig,
    AreaPerimeterComparisonViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: AreaPerimeterComparisonViewConfig;
    payload: ViewRenderPayload<'area-perimeter-comparison'>;
}

const CELL_SIZE = 22;

function validRectangle(rectangle: RectangleMeasures) {
    return Number.isInteger(rectangle.width)
        && Number.isInteger(rectangle.height)
        && rectangle.width >= 2
        && rectangle.height >= 2
        && rectangle.width <= 8
        && rectangle.height <= 8
        && rectangle.area === rectangle.width * rectangle.height
        && rectangle.perimeter === 2 * (rectangle.width + rectangle.height);
}

function validateRelation(data: AreaPerimeterRelationProblem) {
    validateProblemData('area-perimeter-comparison', data, [
        'task',
        'equalMeasure',
        'first',
        'second',
        'unit',
        'areaUnit'
    ]);
    const validMeasures = data.task === 'same-perimeter'
        ? data.equalMeasure === 'perimeter'
            && data.first.perimeter === data.second.perimeter
            && data.first.area !== data.second.area
        : data.equalMeasure === 'area'
            && data.first.area === data.second.area
            && data.first.perimeter !== data.second.perimeter;

    if (
        data.unit !== 'units'
        || data.areaUnit !== 'square units'
        || !validRectangle(data.first)
        || !validRectangle(data.second)
        || !validMeasures
    ) {
        throw new ViewValidationError(
            'area-perimeter-comparison',
            'Expected two valid rectangles with exactly one equal measure and one different measure.'
        );
    }
}

function RectangleGrid({rectangle}: {rectangle: RectangleMeasures}) {
    const width = rectangle.width * CELL_SIZE;
    const height = rectangle.height * CELL_SIZE;
    const x = (260 - width) / 2;
    const y = (210 - height) / 2 + 10;

    return (
        <svg viewBox="0 0 260 230" className="h-[230px] w-[260px]" aria-label={`${rectangle.width} unit by ${rectangle.height} unit rectangle`}>
            {Array.from({length: rectangle.height}, (_, row) =>
                Array.from({length: rectangle.width}, (__, column) => (
                    <rect
                        key={`${row}-${column}`}
                        x={x + column * CELL_SIZE}
                        y={y + row * CELL_SIZE}
                        width={CELL_SIZE}
                        height={CELL_SIZE}
                        fill={(row + column) % 2 === 0 ? '#dbeafe' : '#eff6ff'}
                        stroke="#64748b"
                        strokeWidth="1.3"
                    />
                ))
            )}
            <rect x={x} y={y} width={width} height={height} fill="none" stroke="#334155" strokeWidth="4" />
            <text x={x + width / 2} y={y - 10} textAnchor="middle" className="fill-slate-700 text-[14px] font-bold">
                {rectangle.width} units
            </text>
            <text x={x - 14} y={y + height / 2} textAnchor="middle" transform={`rotate(-90 ${x - 14} ${y + height / 2})`} className="fill-slate-700 text-[14px] font-bold">
                {rectangle.height} units
            </text>
        </svg>
    );
}

function RectangleCard({name, rectangle, showCalculations}: {
    name: 'A' | 'B';
    rectangle: RectangleMeasures;
    showCalculations: boolean;
}) {
    return (
        <div className="w-[300px] rounded-xl border-2 border-slate-200 bg-white px-3 pb-3 pt-2 text-center">
            <div className="text-[1rem] font-extrabold text-slate-700">Rectangle {name}</div>
            <RectangleGrid rectangle={rectangle} />
            <div className={`min-h-[48px] font-mono text-[0.92rem] font-bold ${showCalculations ? 'text-slate-700' : 'text-transparent'}`}>
                <div>P = 2 × ({rectangle.width} + {rectangle.height}) = {rectangle.perimeter} units</div>
                <div>A = {rectangle.width} × {rectangle.height} = {rectangle.area} square units</div>
            </div>
        </div>
    );
}

const AreaPerimeterComparisonCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateRelation(data);
    const samePerimeter = data.task === 'same-perimeter';

    return (
        <div className="w-[740px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="text-center text-[1.3rem] font-bold text-slate-700">
                {samePerimeter
                    ? 'These rectangles have the same perimeter. Compare their areas.'
                    : 'These rectangles have the same area. Compare their perimeters.'}
            </div>
            <div className="mt-4 flex justify-center gap-5 rounded-xl bg-slate-50 p-4">
                <RectangleCard name="A" rectangle={data.first} showCalculations={isSolutionView} />
                <RectangleCard name="B" rectangle={data.second} showCalculations={isSolutionView} />
            </div>
            <div className={`mt-4 min-h-[60px] rounded-xl border-2 px-5 py-3 text-center font-mono text-[1.05rem] font-bold ${
                isSolutionView
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-600'
            }`}>
                {isSolutionView
                    ? samePerimeter
                        ? `Perimeters: ${data.first.perimeter} = ${data.second.perimeter} ${data.unit}. Areas: ${data.first.area} ≠ ${data.second.area} ${data.areaUnit}.`
                        : `Areas: ${data.first.area} = ${data.second.area} ${data.areaUnit}. Perimeters: ${data.first.perimeter} ≠ ${data.second.perimeter} ${data.unit}.`
                    : samePerimeter
                        ? `Both perimeters are ${data.first.perimeter} ${data.unit}. Are the areas equal?`
                        : `Both areas are ${data.first.area} ${data.areaUnit}. Are the perimeters equal?`}
            </div>
        </div>
    );
};

export const AreaPerimeterComparison = withConfig(
    AreaPerimeterComparisonViewSchema,
    AreaPerimeterComparisonCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'area-perimeter-comparison'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<AreaPerimeterComparison payload={payload} />);
};
