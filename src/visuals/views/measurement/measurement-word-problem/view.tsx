import {Scope} from 'edugraph-ts';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ArithmeticOperation, ArithmeticPairProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    MeasurementWordProblemViewConfig,
    MeasurementWordProblemViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasurementWordProblemViewConfig;
    payload: ViewRenderPayload<'measurement-word-problem'>;
}

type UnitProfile = {
    unit: 'g' | 'kg' | 'L';
    unitName: 'grams' | 'kilograms' | 'liters';
    theme: string;
};

const unitProfiles: Record<string, UnitProfile> = {
    [Scope.GramScale]: {unit: 'g', unitName: 'grams', theme: 'rose'},
    [Scope.KilogramScale]: {unit: 'kg', unitName: 'kilograms', theme: 'amber'},
    [Scope.LiterScale]: {unit: 'L', unitName: 'liters', theme: 'sky'}
};

const symbols: Record<ArithmeticOperation, string> = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷'
};

const expectedAnswer = ({operation, num1, num2}: ArithmeticPairProblem): number => {
    if (operation === 'addition') return num1 + num2;
    if (operation === 'subtraction') return num1 - num2;
    if (operation === 'multiplication') return num1 * num2;
    return num1 / num2;
};

const storyFor = (data: ArithmeticPairProblem, profile: UnitProfile): string => {
    const {num1, num2, operation} = data;
    const {unitName} = profile;
    if (profile.unit === 'L') {
        if (operation === 'addition') return `A tank holds ${num1} ${unitName}. ${num2} more ${unitName} are poured in. How many ${unitName} does it hold now?`;
        if (operation === 'subtraction') return `A tank holds ${num1} ${unitName}. ${num2} ${unitName} are poured out. How many ${unitName} remain?`;
        if (operation === 'multiplication') return `There are ${num1} jugs. Each jug holds ${num2} ${unitName}. How many ${unitName} do the jugs hold altogether?`;
        return `${num1} ${unitName} of water are shared equally among ${num2} containers. How many ${unitName} go in each container?`;
    }
    if (operation === 'addition') return `A class has ${num1} ${unitName} of modeling material and receives ${num2} more ${unitName}. How many ${unitName} does it have now?`;
    if (operation === 'subtraction') return `A supply bag holds ${num1} ${unitName} of material. The class uses ${num2} ${unitName}. How many ${unitName} remain?`;
    if (operation === 'multiplication') return `There are ${num1} equal packets. Each packet has a mass of ${num2} ${unitName}. What is their total mass in ${unitName}?`;
    return `Material with a mass of ${num1} ${unitName} is split equally among ${num2} bags. What is the mass of each bag in ${unitName}?`;
};

const evidenceFor = (data: ArithmeticPairProblem, profile: UnitProfile): readonly [string, string] => {
    const {num1, num2, operation} = data;
    if (operation === 'addition') return [`Starting amount: ${num1} ${profile.unit}`, `Amount added: ${num2} ${profile.unit}`];
    if (operation === 'subtraction') return [`Starting amount: ${num1} ${profile.unit}`, `Amount removed: ${num2} ${profile.unit}`];
    if (operation === 'multiplication') return [`Number of groups: ${num1}`, `Amount in each group: ${num2} ${profile.unit}`];
    return [`Total amount: ${num1} ${profile.unit}`, `Number of equal groups: ${num2}`];
};

const validateProblem = (data: ArithmeticPairProblem) => {
    validateProblemData('measurement-word-problem', data, [
        'num1', 'num2', 'operation', 'answer', 'blankPart'
    ]);
    if (!Number.isInteger(data.num1) || data.num1 <= 0
        || !Number.isInteger(data.num2) || data.num2 <= 0
        || !Number.isInteger(data.answer) || data.answer <= 0
        || data.blankPart !== 'solution'
        || expectedAnswer(data) !== data.answer) {
        throw new ViewValidationError('measurement-word-problem', 'Expected a coherent positive whole-number equation with an unknown solution.');
    }
};

const MeasurementWordProblemCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblem(data);

    const scale = config.scale;
    const measurement = config.measurement;
    if (!scale || !measurement) {
        throw new ViewValidationError('measurement-word-problem', 'Measurement family and unit scale are required.');
    }
    const profile = unitProfiles[scale];
    const compatible = measurement === Scope.WeightMeasurement
        ? scale === Scope.GramScale || scale === Scope.KilogramScale
        : measurement === Scope.LiquidVolumes && scale === Scope.LiterScale;
    if (!profile || !compatible) {
        throw new ViewValidationError('measurement-word-problem', 'Measurement family and unit scale are incompatible.');
    }

    const evidence = evidenceFor(data, profile);
    const answer = isSolutionView ? String(data.answer) : '?';

    return (
        <div className="w-[760px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Same-unit measurement story</div>
                <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-bold text-violet-800">Unit: {profile.unitName} ({profile.unit})</div>
            </div>

            <div className="mt-3 rounded-xl border-l-4 border-violet-500 bg-slate-50 px-5 py-4 text-xl font-semibold leading-relaxed text-slate-800">
                {storyFor(data, profile)}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
                {evidence.map((item, index) => (
                    <div key={item} className="rounded-xl border-2 border-slate-200 bg-white px-4 py-5 text-center">
                        <div className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">Given {index + 1}</div>
                        <div className="mt-2 text-xl font-extrabold text-slate-800">{item}</div>
                    </div>
                ))}
            </div>

            <div className="mt-5 rounded-xl bg-slate-800 px-6 py-5 text-center text-white">
                <div className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">One-step equation</div>
                <div className="mt-2 font-mono text-[2.1rem] font-extrabold">
                    {data.num1} {symbols[data.operation]} {data.num2} = <span className={isSolutionView ? 'text-emerald-300' : 'text-amber-300'}>{answer}</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-300">The measured answer is in {profile.unitName}.</div>
            </div>

            <div className={`mt-5 rounded-xl border-2 px-5 py-4 text-center text-xl font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 text-slate-400'}`}>
                Answer: {answer} {profile.unit}
            </div>
        </div>
    );
};

export const MeasurementWordProblemView = withConfig(
    MeasurementWordProblemViewSchema,
    MeasurementWordProblemCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measurement-word-problem'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasurementWordProblemView payload={payload} />);
};
