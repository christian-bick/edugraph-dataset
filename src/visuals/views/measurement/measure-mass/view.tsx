import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {MassMeasurementProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureMassViewConfig, MeasureMassViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasureMassViewConfig;
    payload: ViewRenderPayload<'measure-mass'>;
}

const profiles: Record<MassMeasurementProblem['object'], {name: string; unit: 'g' | 'kg'; value: number}> = {
    apple: {name: 'Apple', unit: 'g', value: 180},
    book: {name: 'Book', unit: 'g', value: 450},
    'toy-car': {name: 'Toy car', unit: 'g', value: 320},
    watermelon: {name: 'Watermelon', unit: 'kg', value: 4},
    backpack: {name: 'Backpack', unit: 'kg', value: 3},
    suitcase: {name: 'Suitcase', unit: 'kg', value: 12}
};

const ObjectPicture = ({object}: {object: MassMeasurementProblem['object']}) => {
    if (object === 'apple') return <g>
        <path d="M155 62 Q148 38 169 26" fill="none" stroke="#166534" strokeWidth="8" strokeLinecap="round" />
        <path d="M160 69 C105 43 72 95 91 151 C107 199 139 208 160 194 C181 208 213 199 229 151 C248 95 215 43 160 69 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="6" />
    </g>;
    if (object === 'book') return <g>
        <path d="M78 55 H226 V202 H78 Q61 202 61 185 V72 Q61 55 78 55 Z" fill="#818cf8" stroke="#3730a3" strokeWidth="7" />
        <line x1="94" y1="55" x2="94" y2="202" stroke="#3730a3" strokeWidth="5" />
        <path d="M114 91 H202 M114 116 H190" stroke="#e0e7ff" strokeWidth="7" strokeLinecap="round" />
    </g>;
    if (object === 'toy-car') return <g>
        <path d="M68 135 L94 88 H203 L237 135 H258 V184 H55 V144 Q55 135 68 135 Z" fill="#38bdf8" stroke="#075985" strokeWidth="6" strokeLinejoin="round" />
        <circle cx="101" cy="187" r="25" fill="#334155" /><circle cx="211" cy="187" r="25" fill="#334155" />
        <circle cx="101" cy="187" r="10" fill="#cbd5e1" /><circle cx="211" cy="187" r="10" fill="#cbd5e1" />
    </g>;
    if (object === 'watermelon') return <g>
        <ellipse cx="160" cy="133" rx="105" ry="72" fill="#22c55e" stroke="#166534" strokeWidth="7" />
        <path d="M91 83 Q120 133 91 183 M137 64 Q158 133 137 202 M183 64 Q162 133 183 202 M229 83 Q200 133 229 183" fill="none" stroke="#15803d" strokeWidth="7" />
    </g>;
    if (object === 'backpack') return <g>
        <path d="M100 89 Q100 44 160 44 Q220 44 220 89" fill="none" stroke="#7c2d12" strokeWidth="12" />
        <rect x="75" y="72" width="170" height="154" rx="35" fill="#fb923c" stroke="#9a3412" strokeWidth="7" />
        <rect x="105" y="142" width="110" height="65" rx="22" fill="#fdba74" stroke="#9a3412" strokeWidth="6" />
    </g>;
    return <g>
        <rect x="72" y="72" width="176" height="155" rx="20" fill="#a78bfa" stroke="#5b21b6" strokeWidth="7" />
        <path d="M118 72 Q118 35 160 35 Q202 35 202 72" fill="none" stroke="#5b21b6" strokeWidth="9" />
        <line x1="160" y1="72" x2="160" y2="227" stroke="#5b21b6" strokeWidth="5" />
    </g>;
};

const MeasureMassCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('measure-mass', data, ['measurementKind', 'object', 'unit', 'value', 'instrument']);
    if (data.measurementKind !== 'mass') {
        throw new ViewValidationError('measure-mass', 'Expected a mass measurement.');
    }
    if (!(data.object in profiles)
        || data.instrument !== 'digital-scale'
        || data.unit !== profiles[data.object].unit
        || data.value !== profiles[data.object].value) {
        throw new ViewValidationError('measure-mass', 'Unsupported mass measurement.');
    }
    const profile = profiles[data.object];

    return <div className="w-[610px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
        <div className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Measure mass</div>
        <div className="mt-1 text-[1.4rem] font-bold text-slate-800">What is the mass of the {profile.name.toLowerCase()}?</div>

        <svg viewBox="0 0 540 430" className="mx-auto mt-3 h-[430px] w-[540px]" role="img" aria-label={`${profile.name} on a digital scale`}>
            <g transform="translate(110 10)"><ObjectPicture object={data.object} /></g>
            <path d="M92 238 H448 L482 385 Q487 408 463 408 H77 Q53 408 58 385 Z" fill="#dbeafe" stroke="#334155" strokeWidth="7" strokeLinejoin="round" />
            <rect x="164" y="294" width="212" height="76" rx="12" fill="#0f172a" stroke="#475569" strokeWidth="5" />
            <text x="270" y="344" textAnchor="middle" className="fill-emerald-300 font-mono text-[39px] font-bold">{data.value} {data.unit}</text>
            <path d="M111 238 Q117 208 146 208 H394 Q423 208 429 238" fill="#bfdbfe" stroke="#334155" strokeWidth="7" />
        </svg>

        <div className={`rounded-xl border-2 px-5 py-4 text-center text-xl font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 text-slate-400'}`}>
            {isSolutionView
                ? `The ${profile.name.toLowerCase()} has a mass of ${data.value} ${data.unit}.`
                : `The ${profile.name.toLowerCase()} has a mass of ____ ${data.unit}.`}
        </div>
    </div>;
};

export const MeasureMass = withConfig(MeasureMassViewSchema, MeasureMassCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'measure-mass'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<MeasureMass payload={payload} />);
    }
};
