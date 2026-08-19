import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeDefinition, ShapeExcludedQuadrilateralProblem} from '../../../../types/problems.ts';
import {getTracePath, rotationDrawingPresentation} from './helpers.ts';
import {ShapeDrawShapeViewConfig, ShapeDrawShapeViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {shapeConstructionCountsMatch} from '../helpers.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeDrawShapeViewConfig;
    payload: ViewRenderPayload<'shape-draw-shape'>;
}

const SUPPORTED_SHAPES = ['circle', 'triangle', 'square', 'rectangle', 'quadrilateral'] as const;

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
    if (definition.equalSides === true) lines.push('All sides have equal length');
    if (definition.equalSides === false) lines.push('Sides are not all equal');
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

function LegacyDrawingLayout({
    shape,
    isSolutionView
}: {
    shape: string;
    isSolutionView: boolean;
}) {
    const promptText = `Draw the same ${shape}. Turning it does not change the shape.`;
    const pathD = getTracePath(shape);
    const {referenceRotation, showCompletedDrawing} = rotationDrawingPresentation(shape, isSolutionView);

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit mx-auto font-sans">
            <div className="flex w-[560px] flex-col items-center">
                <div className="text-[1.3rem] font-bold text-slate-700 mb-[25px] text-center leading-normal">
                    {promptText}
                </div>

                <div className="flex w-full items-stretch justify-center gap-4">
                    <div className="flex h-[220px] w-[250px] flex-col items-center justify-center rounded-xl border-2 border-blue-200 bg-blue-50 p-3">
                        <span className="mb-1 text-sm font-bold text-blue-700">Reference</span>
                        <svg width="150" height="150" viewBox="0 0 100 100" aria-label={`Reference ${shape}`}>
                            <g transform={`rotate(${referenceRotation} 50 50)`}>
                                <path d={pathD} fill="none" stroke="#1d4ed8" strokeWidth="4" />
                            </g>
                        </svg>
                    </div>
                    <div className="flex h-[220px] w-[250px] flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50 p-3">
                        <span className="mb-1 text-sm font-bold text-slate-600">Your drawing</span>
                        {showCompletedDrawing
                            ? (
                                <svg width="150" height="150" viewBox="0 0 100 100" aria-label={`Completed ${shape} drawing`}>
                                <path d={pathD} fill="none" stroke="forestgreen" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )
                            : <div className="flex h-[150px] items-center text-lg font-bold text-slate-400">Draw here</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function validateExcludedQuadrilateral(data: ShapeExcludedQuadrilateralProblem) {
    const definition = data.definition;
    const exclusions = ['rhombus', 'rectangle', 'square'];
    if (
        data.target !== 'quadrilateral'
        || data.sides !== 4
        || data.corners !== 4
        || definition.sideCount !== 4
        || definition.vertexCount !== 4
        || definition.boundary !== 'straight'
        || definition.equalSides !== false
        || definition.rightAngleCount !== 0
        || data.excludedCategories.length !== exclusions.length
        || !exclusions.every((category, index) => data.excludedCategories[index] === category)
    ) {
        throw new ViewValidationError(
            'shape-draw-shape',
            'The excluded-subcategory quadrilateral payload is invalid.'
        );
    }
}

function ExcludedQuadrilateralLayout({
    data,
    isSolutionView
}: {
    data: ShapeExcludedQuadrilateralProblem;
    isSolutionView: boolean;
}) {
    const pathD = getTracePath(data.target);
    const exclusions = [
        ['Rhombus', 'Needs 4 equal sides', 'Sides are not all equal'],
        ['Rectangle', 'Needs 4 right angles', 'Has no right angles'],
        ['Square', 'Needs equal sides and right angles', 'Has neither property']
    ] as const;

    return (
        <div className="mx-auto flex w-fit justify-center rounded-2xl bg-white p-[28px] font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex w-[650px] flex-col items-center gap-4">
                <div className="text-center text-[1.25rem] font-bold leading-normal text-slate-700">
                    Draw a quadrilateral that is not a rhombus, rectangle, or square.
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    {definitionLines(data.definition).map(line => (
                        <span key={line} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                            {line}
                        </span>
                    ))}
                </div>
                <div className="flex w-full items-stretch gap-4">
                    <div className="flex h-[250px] w-[300px] items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                        <svg width="190" height="190" viewBox="0 0 100 100" aria-label="Other quadrilateral drawing">
                            {isSolutionView && (
                                <path d={pathD} fill="#dcfce7" stroke="forestgreen" strokeWidth="3" strokeLinejoin="round" />
                            )}
                        </svg>
                    </div>
                    <div className="flex flex-1 flex-col justify-center gap-2">
                        {exclusions.map(([category, requirement, evidence]) => (
                            <div key={category} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                <div className="font-extrabold text-slate-700">Not a {category.toLowerCase()}</div>
                                <div className="text-xs font-semibold text-slate-500">{requirement}</div>
                                <div className={`mt-1 text-sm font-bold ${isSolutionView ? 'text-emerald-700' : 'text-blue-700'}`}>
                                    {isSolutionView ? `✓ ${evidence}` : evidence}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`min-h-[42px] text-center text-sm font-bold ${isSolutionView ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {isSolutionView
                        ? 'This is a quadrilateral, but it belongs to none of the three named subcategories.'
                        : 'Use four straight sides while avoiding the defining attributes of all three subcategories.'}
                </div>
            </div>
        </div>
    );
}

const ShapeDrawShapeCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('shape-draw-shape', data, []);

    validateProblemData('shape-draw-shape', data, ['target', 'sides', 'corners']);
    ensureSupportedShape(data.target);
    if (!shapeConstructionCountsMatch(data.target, data.sides, data.corners)) {
        throw new ViewValidationError('shape-draw-shape', 'The construction counts do not match the named shape.');
    }

    if (data.task === 'exclude-quadrilateral-subcategories') {
        validateProblemData('shape-draw-shape', data, ['task', 'definition', 'excludedCategories']);
        validateExcludedQuadrilateral(data);
        return <ExcludedQuadrilateralLayout data={data} isSolutionView={isSolutionView} />;
    }

    if (data.task === 'rotation-conservation') {
        return (
            <LegacyDrawingLayout
                shape={data.target}
                isSolutionView={isSolutionView}
            />
        );
    }

    if (data.task !== 'specify-attributes') {
        throw new ViewValidationError(
            'shape-draw-shape',
            'Attribute drawing requires a defining-attribute payload.'
        );
    }
    validateProblemData('shape-draw-shape', data, ['task', 'definition']);
    validateDefinition(data.definition);
    return (
        <SpecificationDrawingLayout
            shape={data.target}
            definition={data.definition}
            isSolutionView={isSolutionView}
        />
    );
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
