import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ViewValidationError, validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {CountingNumberSequenceViewConfig, CountingNumberSequenceViewSchema} from './spec.ts';
import {resolveSequenceLayout} from './helpers.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: CountingNumberSequenceViewConfig;
    payload: ViewRenderPayload<'counting-number-sequence'>;
}

const CountingNumberSequenceCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;

    validateProblemData('counting-number-sequence', data, [
        'sequence',
        'missingIndex',
        'answer',
        'stepSize'
    ]);

    if (data.sequence.length < 2 || data.sequence.length > 10) {
        throw new ViewValidationError('counting-number-sequence', 'Sequence length must be between 2 and 10.');
    }
    if (data.sequence.some(value => !Number.isInteger(value) || value < 1)) {
        throw new ViewValidationError('counting-number-sequence', 'Sequence values must be positive integers.');
    }
    if (!Number.isInteger(data.missingIndex) || data.missingIndex <= 0 || data.missingIndex >= data.sequence.length) {
        throw new ViewValidationError('counting-number-sequence', 'Missing position must follow the visible starting value.');
    }
    if (!Number.isInteger(data.answer) || data.sequence[data.missingIndex] !== data.answer) {
        throw new ViewValidationError('counting-number-sequence', 'Answer does not match the missing sequence value.');
    }
    if (![1, 5, 10, 100].includes(data.stepSize)) {
        throw new ViewValidationError('counting-number-sequence', 'Step size must be 1, 5, 10, or 100.');
    }
    for (let index = 1; index < data.sequence.length; index++) {
        if (data.sequence[index] - data.sequence[index - 1] !== data.stepSize) {
            throw new ViewValidationError('counting-number-sequence', 'Sequence values do not follow the declared step.');
        }
    }

    const {usesTiles, tileSizeClass, tileClass} = resolveSequenceLayout(config.representation, data.sequence);
    const numeralSizeClass = Math.max(...data.sequence) >= 1000 ? 'text-lg' : 'text-xl';

    return (
        <div className="flex justify-center items-center p-6 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] w-fit mx-auto font-sans">
            <div className="flex flex-col items-center max-w-[760px]">
                {!isSolutionView && (
                    <div className="text-2xl font-bold text-slate-700 mb-6 text-center">
                        Fill in the missing number.
                    </div>
                )}
                <div className="flex flex-nowrap justify-center items-center gap-2.5 p-5 bg-slate-100 border-2 border-slate-200 rounded-xl">
                    {data.sequence.map((value, index) => {
                        const isMissing = index === data.missingIndex;
                        const solutionClass = isMissing && isSolutionView
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-extrabold'
                            : tileClass;
                        return (
                            <div
                                key={`${index}-${value}`}
                                className={`${tileSizeClass} border-2 rounded-lg flex flex-col items-center justify-center ${numeralSizeClass} font-mono font-bold text-slate-800 ${solutionClass}`}
                            >
                                {isMissing && !isSolutionView ? '' : (
                                    <>
                                        {usesTiles && (
                                            <div className="grid grid-cols-5 gap-1 mb-1.5" aria-label={`${value} countable dots`}>
                                                {Array.from({length: value}, (_, dotIndex) => (
                                                    <span key={dotIndex} className="w-1.5 h-1.5 rounded-full bg-amber-600"/>
                                                ))}
                                            </div>
                                        )}
                                        <span>{value}</span>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const CountingNumberSequence = withConfig(CountingNumberSequenceViewSchema, CountingNumberSequenceCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'counting-number-sequence'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<CountingNumberSequence payload={payload}/>);
    }
};
