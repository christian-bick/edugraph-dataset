import type {
    ShapeCategoryHierarchyProblem,
    ShapeHierarchyCategory,
    ShapeHierarchyClassificationCases
} from '../../../types/problems.ts';
import {
    figureLetters,
    figureMembers,
    figurePoints,
    hierarchyCategories,
    propertyPhrase
} from './shape-hierarchy-helpers.ts';

export type ShapeHierarchyTask = 'inherit' | 'classify';
interface Props {
    data: ShapeCategoryHierarchyProblem;
    isSolutionView: boolean;
    task: ShapeHierarchyTask;
}

const titleCase = (category: ShapeHierarchyCategory): string =>
    category[0]!.toUpperCase() + category.slice(1);

const attributeText = {
    'four-straight-sides': 'four straight sides',
    'four-right-angles': 'four right angles',
    'four-equal-sides': 'four equal sides'
} as const;

function InheritanceTask({data, isSolutionView}: Omit<Props, 'task'>) {
    const {broader, property} = data.inheritance;
    const category = titleCase(broader);
    const phrase = propertyPhrase(property);
    return <>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Shape families</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Find the inherited property</h1>
        <p className="mt-2 text-base text-slate-700">Use both facts to infer a property of every square. Explain why the property must hold.</p>
        <div className="mt-5 grid grid-cols-[1fr_72px_1fr] items-stretch gap-3">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                <div className="text-sm font-bold uppercase tracking-wide text-indigo-700">Broader category</div>
                <div className="mt-2 text-xl font-bold text-indigo-950">{category}</div>
                <p className="mt-2 text-base text-slate-800">Every {broader} has <strong>{phrase}</strong>.</p>
            </div>
            <div className="flex items-center justify-center text-4xl font-bold text-slate-400">→</div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
                <div className="text-sm font-bold uppercase tracking-wide text-violet-700">Inclusion fact</div>
                <div className="mt-2 text-xl font-bold text-violet-950">Square ⊂ {category}</div>
                <p className="mt-2 text-base text-slate-800">Every square is a {broader}.</p>
            </div>
        </div>
        <div className={`mt-5 rounded-2xl border-2 p-5 ${isSolutionView
            ? 'border-emerald-300 bg-emerald-50' : 'border-dashed border-slate-300 bg-slate-50'}`}>
            <div className="text-sm font-bold uppercase tracking-wide text-slate-700">What follows for squares?</div>
            {isSolutionView
                ? <p className="mt-2 text-lg text-emerald-950">Every square has <strong>{phrase}</strong> because every square is a {broader}, and every {broader} has {phrase}.</p>
                : <p className="mt-2 text-lg text-slate-600">Every square has ____________________. This follows because ______________________________.</p>}
        </div>
    </>;
}

interface NodeProps {
    category: ShapeHierarchyCategory;
    centerX: number;
    centerY: number;
    cases: ShapeHierarchyClassificationCases | undefined;
    isSolutionView: boolean;
}

function HierarchyNode({category, centerX, centerY, cases, isSolutionView}: NodeProps) {
    const x = centerX - 95;
    const y = centerY - 34;
    return <g data-hierarchy-node={category}>
        <rect x={x} y={y} width="190" height="68" rx="12"
            fill={isSolutionView ? '#ecfdf5' : '#ffffff'}
            stroke={isSolutionView ? '#10b981' : '#94a3b8'} strokeWidth="2"
            strokeDasharray={isSolutionView ? undefined : '7 5'} />
        <text x={centerX} y={centerY - (cases ? 3 : -5)} textAnchor="middle"
            className={`text-[19px] font-bold ${isSolutionView ? 'fill-emerald-950' : 'fill-slate-400'}`}>
            {isSolutionView ? titleCase(category) : '____________'}
        </text>
        {cases && <text x={centerX} y={centerY + 20} textAnchor="middle"
            className={`text-[13px] font-semibold ${isSolutionView ? 'fill-emerald-800' : 'fill-slate-400'}`}>
            {isSolutionView ? `Figures: ${figureMembers(cases, category)}` : 'Figures: ____'}
        </text>}
    </g>;
}

function HierarchyDiagram({data, isSolutionView}: Omit<Props, 'task'>) {
    const cases = data.classificationCases;
    return <svg viewBox="0 0 620 360" className="h-[360px] w-[620px]" role="img"
        aria-label={isSolutionView
            ? 'Completed shape hierarchy with the square beneath both rectangle and rhombus'
            : 'Blank four-category shape hierarchy with two parent branches above the bottom box'}>
        <rect width="620" height="360" rx="18" fill="#f8fafc" />
        <defs>
            <marker id="hierarchy-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <path d="M 0 0 L 9 4.5 L 0 9 z" fill="#64748b" />
            </marker>
        </defs>
        <g stroke="#64748b" strokeWidth="2.5" markerEnd="url(#hierarchy-arrow)" fill="none">
            <line x1="160" y1="132" x2="260" y2="79" />
            <line x1="460" y1="132" x2="360" y2="79" />
            <line x1="266" y1="265" x2="188" y2="212" />
            <line x1="354" y1="265" x2="432" y2="212" />
        </g>
        <HierarchyNode category="quadrilateral" centerX={310} centerY={45} cases={cases} isSolutionView={isSolutionView} />
        <HierarchyNode category="rectangle" centerX={160} centerY={166} cases={cases} isSolutionView={isSolutionView} />
        <HierarchyNode category="rhombus" centerX={460} centerY={166} cases={cases} isSolutionView={isSolutionView} />
        <HierarchyNode category="square" centerX={310} centerY={300} cases={cases} isSolutionView={isSolutionView} />
        <text x="310" y="352" textAnchor="middle" className="fill-slate-600 text-[12px] font-semibold">
            Each arrow means “is a kind of”
        </text>
    </svg>;
}

function FigureGallery({cases}: {cases: ShapeHierarchyClassificationCases}) {
    return <div className="grid grid-cols-2 gap-2">
        {cases.map((figure, index) => <div key={figure.kind}
            className="rounded-xl border border-slate-200 bg-white p-2 text-center">
            <div className="text-sm font-bold text-slate-700">Figure {figureLetters[index]}</div>
            <svg viewBox="0 0 96 96" className="mx-auto h-[86px] w-[86px]" role="img"
                aria-label={`Figure ${figureLetters[index]} with four sides`}>
                <polygon points={figurePoints(figure.vertices)} fill="#e0e7ff" stroke="#4338ca" strokeWidth="3" />
            </svg>
            <div className="text-xs text-slate-600">
                {figure.rightAngleCount === 4 ? '4 right angles' : 'No right angles'} · {figure.allSidesEqual ? '4 equal sides' : 'Sides not all equal'}
            </div>
        </div>)}
    </div>;
}

function ClassificationTask({data, isSolutionView}: Omit<Props, 'task'>) {
    return <>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Shape families</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Build the shape hierarchy</h1>
        <p className="mt-2 text-base text-slate-700">Place the category names in the boxes. Each upward arrow means that every member of the lower category also belongs to the upper category. The left middle box has four right angles; the right middle box has four equal sides.{data.classificationCases && ' Write each figure letter in every category box it belongs to.'}</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
            {hierarchyCategories.map(category => <div key={category}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
                <div className="font-bold text-indigo-900">{titleCase(category)}</div>
                <div className="text-xs leading-snug text-slate-700">
                    {data.categoryAttributes[category].map(attribute => attributeText[attribute]).join(', ')}
                </div>
            </div>)}
        </div>
        <div className="mt-4 grid grid-cols-[620px_1fr] items-center gap-4">
            <HierarchyDiagram data={data} isSolutionView={isSolutionView} />
            <div>
                {data.classificationCases
                    ? <FigureGallery cases={data.classificationCases} />
                    : <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-base text-slate-700">
                        Compare the defining properties to decide which categories belong above the others.
                    </div>}
            </div>
        </div>
        {isSolutionView && <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-base text-emerald-950">
            A square belongs to both rectangles and rhombuses: it has four right angles and four equal sides. Both categories belong to quadrilaterals.
        </p>}
    </>;
}

export function ShapeHierarchyBody({data, isSolutionView, task}: Props) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm"
        style={{width: task === 'classify' ? 1120 : 860, maxWidth: '95vw'}}>
        {task === 'inherit'
            ? <InheritanceTask data={data} isSolutionView={isSolutionView} />
            : <ClassificationTask data={data} isSolutionView={isSolutionView} />}
    </main>;
}
