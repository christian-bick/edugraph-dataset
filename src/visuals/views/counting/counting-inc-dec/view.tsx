import {createRoot} from 'react-dom/client';
import {Fragment} from 'react';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {CountingIncDecViewConfig, CountingIncDecViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData} from '../../../helpers/validation.ts';
import {countingSequencePositions, validateCountingIncDecProblem} from './helpers.ts';
import '../../../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface CoreProps {
    config: CountingIncDecViewConfig;
    payload: ViewRenderPayload<'counting-inc-dec'>;
}

export const CountingIncDecCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const seed = payload.seed;
    const data = problem.data;

    validateProblemData('counting-inc-dec', data, [
        'numObjects',
        'incDecType',
        'incDecAnswer',
        'simpleAnswer',
        'stepSize',
        'startPlaceValue',
        'resultPlaceValue'
    ]);
    validateCountingIncDecProblem(data);

    const icon = ICONS[seed % ICONS.length];
    const isInc = data.incDecType === 'inc';
    const positions = countingSequencePositions(data);

    return (
        <div className="flex flex-col items-center gap-5 p-6 bg-white rounded-2xl w-fit font-sans">
            <div className="text-center text-xl font-bold text-slate-700">
                <div>Count {isInc ? 'forward' : 'backward'}.</div>
                <div className="h-6 text-base font-normal">{!isSolutionView && 'Write the missing number.'}</div>
            </div>
            <div className="flex w-[420px] flex-col items-center gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold text-slate-600">Starting objects</div>
                <div className="grid grid-cols-5 gap-2.5">
                    {Array.from({ length: data.numObjects }).map((_, i) => {
                        const isRemoved = !isInc && i >= data.incDecAnswer;
                        return (
                            <div key={i} className="relative h-[40px] w-[40px]" data-counting-object="true">
                                <img
                                    src={`/icons/counting/${icon}`}
                                    alt="counting object"
                                    className={`h-[40px] w-[40px] ${isRemoved ? 'opacity-[0.35] grayscale' : ''}`}
                                />
                                {isRemoved && (
                                    <span data-removed-object="true" className="absolute left-1/2 top-1/2 h-[3px] w-[46px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded bg-rose-600" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="flex flex-col items-center gap-3">
                <div className="font-semibold text-slate-600">Counting sequence</div>
                <div className="flex items-center gap-4" data-counting-sequence="true">
                    {positions.map((position, index) => {
                        const isResult = position.role === 'result';
                        return <Fragment key={position.role}>
                            {index > 0 && <div className="flex w-[84px] flex-col items-center text-slate-700">
                                <span className="text-2xl font-mono font-bold" data-signed-step="true">{isInc ? '+' : '−'}{data.stepSize}</span>
                                <span className="text-[3rem] leading-none" data-step-direction={isInc ? 'right' : 'left'}>{isInc ? '→' : '←'}</span>
                            </div>}
                            <div className="flex flex-col items-center gap-2">
                                <div className="text-sm font-semibold text-slate-600">
                                    {isResult ? (isInc ? 'After' : 'Before') : 'Start'}
                                </div>
                                <div
                                    data-sequence-position={position.role}
                                    className={`flex h-[76px] w-[96px] items-center justify-center rounded-lg border-2 text-3xl font-mono font-bold ${
                                        isResult && isSolutionView
                                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                            : 'border-slate-400 bg-white text-slate-800'
                                    }`}
                                >
                                    {!isResult || isSolutionView ? position.value : ''}
                                </div>
                            </div>
                        </Fragment>;
                    })}
                </div>
            </div>
        </div>
    );
};

export const CountingIncDec = withConfig(CountingIncDecViewSchema, CountingIncDecCore);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'counting-inc-dec'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<CountingIncDec payload={payload} />);
        }
    };
}
