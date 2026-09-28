import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeAssembly, ShapeCompositionComposite} from '../../../../types/problems.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {shapeCompositionLabel, validateShapeComposition} from '../shape-composition-presentation.ts';
import {assemblyPieceFrame, ShapeAssemblyDrawing, validateShapeAssembly} from '../shape-composition-geometry.tsx';
import {ShapeComposeShapesConstructionViewConfig, ShapeComposeShapesConstructionViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'shape-compose-shapes-construction';
interface CoreProps {
    config: ShapeComposeShapesConstructionViewConfig;
    payload: ViewRenderPayload<'shape-compose-shapes-construction'>;
}

function PieceTray({assembly, node}: {assembly: ShapeAssembly; node: ShapeCompositionComposite}) {
    const frame = assemblyPieceFrame(assembly.parts);
    return <div className="flex flex-wrap gap-2 justify-center" aria-label="Separate component pieces">
        {assembly.parts.map((part, index) => <div key={index}
            className="w-[94px] h-[104px] rounded-xl border border-slate-200 bg-white px-1 py-1.5 flex flex-col items-center">
            <div className="w-full h-[72px]"><ShapeAssemblyDrawing assembly={part} frame={frame}
                label={shapeCompositionLabel(node.inputs[index].shape)} /></div>
            <span className="text-[11px] leading-tight text-center text-slate-600">{shapeCompositionLabel(node.inputs[index].shape)}</span>
        </div>)}
    </div>;
}

function Workspace({assembly, node, solution, compact = false}: {
    assembly: ShapeAssembly; node: ShapeCompositionComposite; solution: boolean; compact?: boolean;
}) {
    return <section className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-center font-semibold text-slate-700 mb-2">{shapeCompositionLabel(node.shape)}</div>
        <PieceTray assembly={assembly} node={node} />
        <div className="flex items-center justify-center gap-3 my-3">
            <div className="w-[82px] h-[68px]"><ShapeAssemblyDrawing assembly={assembly} neutral label="Target outline" /></div>
            <span className="text-sm text-slate-500">{solution ? 'One arrangement' : 'Draw your arrangement'}</span>
        </div>
        <div className={`${compact ? 'h-[185px]' : 'h-[235px]'} rounded-xl border-2 ${solution
            ? 'border-emerald-400 bg-white' : 'border-dashed border-slate-300 bg-white'}`}
            aria-label={solution ? 'Solved arrangement with joining boundaries' : 'Empty drawing space'}>
            {solution && <ShapeAssemblyDrawing assembly={assembly} showParts label="Joined component pieces" />}
        </div>
    </section>;
}

export function ShapeComposeShapesConstructionCore({payload}: CoreProps) {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['compositionTree', 'compositionDepth', 'assembly']);
    validateShapeComposition(data);
    validateShapeAssembly(data);
    const multi = data.compositionDepth === 2;
    const solution = payload.isSolutionView;
    const target = shapeCompositionLabel(data.compositionTree.shape);
    return <main className="bg-white rounded-2xl p-7 font-sans text-slate-800" style={{width: multi ? 820 : 680}}>
        <p className="text-xs text-indigo-600 font-bold uppercase tracking-[0.16em] mb-2">Compose shapes</p>
        <h1 className="text-xl font-semibold leading-snug mb-2">{multi
            ? `Build the smaller shapes, then join them to make a ${target}.`
            : `Arrange the pieces to make a ${target}.`}</h1>
        <p className="text-sm text-slate-600 mb-5">{solution ? 'One way to join all the pieces is shown.'
            : 'Draw how the pieces fit together. Show every joining edge or face; use all pieces without gaps or overlaps.'}</p>
        {multi && <>
            <h2 className="font-semibold text-indigo-700 mb-3">First, build these pieces</h2>
            <div className="flex gap-3 mb-5">{data.compositionTree.inputs.map((node, index) =>
                node.kind === 'composite' && <Workspace key={index} node={node}
                    assembly={data.assembly.parts[index]} solution={solution} compact />)}</div>
            <h2 className="font-semibold text-indigo-700 mb-3">Then join the pieces you built</h2>
        </>}
        <Workspace assembly={data.assembly} node={data.compositionTree} solution={solution} />
    </main>;
}

export const ShapeComposeShapesConstruction = withConfig(ShapeComposeShapesConstructionViewSchema, ShapeComposeShapesConstructionCore);
let root: ReturnType<typeof createRoot> | null = null;
if (typeof window !== 'undefined') window.renderView = (payload: ViewRenderPayload<'shape-compose-shapes-construction'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<ShapeComposeShapesConstruction payload={payload} />);
};
