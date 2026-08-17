import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {GeometryPrimitiveCandidate} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {PrimitiveScene} from '../primitive-scene.tsx';
import {isValidGeometryPrimitivesIdentificationProblem} from './helpers.ts';
import {
    GeometryPrimitivesIdentificationViewConfig,
    GeometryPrimitivesIdentificationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: GeometryPrimitivesIdentificationViewConfig;
    payload: ViewRenderPayload<'geometry-primitives-identification'>;
}

function CandidateCard({candidate, selected}: {
    candidate: GeometryPrimitiveCandidate;
    selected: boolean;
}) {
    return (
        <div
            className={`relative h-[205px] rounded-xl border-2 p-3 ${
                selected
                    ? 'border-emerald-600 bg-emerald-50 shadow-[0_0_0_3px_rgba(5,150,105,0.12)]'
                    : 'border-slate-200 bg-slate-50'
            }`}
            role="img"
            aria-label={`Diagram ${candidate.id}${selected ? ', selected answer' : ', neutral candidate'}`}
        >
            <div className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[0.95rem] font-extrabold ${
                selected ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-white'
            }`}>
                {candidate.id}
            </div>
            {selected && (
                <div className="absolute right-3 top-3 rounded-full bg-emerald-700 px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-wide text-white">
                    Correct
                </div>
            )}
            <div className="mx-auto h-[170px] w-[235px] pt-4">
                <PrimitiveScene
                    scene={candidate.scene}
                    kind={candidate.kind}
                    markerId={`primitive-candidate-${candidate.id}`}
                    accent={selected ? '#047857' : '#334155'}
                />
            </div>
        </div>
    );
}

const GeometryPrimitivesIdentificationCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    validateProblemData('geometry-primitives-identification', problem.data, [
        'primitiveKind',
        'displayName',
        'definition',
        'identification'
    ]);
    const data = problem.data;
    validateProblemData('geometry-primitives-identification', data.identification, [
        'prompt',
        'candidates',
        'correctCandidateId',
        'answer',
        'answerStatement',
        'explanation'
    ]);
    if (!isValidGeometryPrimitivesIdentificationProblem(data)) {
        throw new ViewValidationError(
            'geometry-primitives-identification',
            'The requested primitive, four distinct diagrams, selected answer, and supplied prose must agree exactly.'
        );
    }

    return (
        <div className="w-[700px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex min-h-[58px] items-center justify-center px-5 text-center text-[1.22rem] font-extrabold leading-snug text-slate-700">
                {data.identification.prompt}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
                {data.identification.candidates.map(candidate => (
                    <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        selected={isSolutionView && candidate.id === data.identification.correctCandidateId}
                    />
                ))}
            </div>
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="text-[1.05rem] font-extrabold">{data.identification.answer}</div>
                    <div className="mt-1 text-[0.9rem] font-semibold leading-snug text-slate-700">{data.identification.explanation}</div>
                </div>
            )}
        </div>
    );
};

export const GeometryPrimitivesIdentification = withConfig(
    GeometryPrimitivesIdentificationViewSchema,
    GeometryPrimitivesIdentificationCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-primitives-identification'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<GeometryPrimitivesIdentification payload={payload} />);
    }
};
