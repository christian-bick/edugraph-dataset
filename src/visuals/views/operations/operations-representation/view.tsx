import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsRepresentationViewConfig, OperationsRepresentationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsRepresentationViewConfig;
    payload: ViewRenderPayload<'operations-representation'>;
}

const Dot = ({color, crossed = false}: {color: string; crossed?: boolean}) => (
    <div className="relative w-12 h-12">
        <div className={`absolute inset-1 rounded-full ${color} border-2 border-slate-700`} />
        {crossed && (
            <div className="absolute left-0 top-1/2 w-12 h-[3px] bg-rose-700 rotate-[-35deg] rounded" />
        )}
    </div>
);

const OperationsRepresentationCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-representation', data, ['num1', 'num2', 'operation', 'answer']);

    const values = [data.num1, data.num2, data.answer];
    if (!values.every(value => Number.isInteger(value) && value >= 0 && value <= 10)
        || !['addition', 'subtraction'].includes(data.operation)) {
        throw new ViewValidationError('operations-representation', 'Expected a non-negative addition or subtraction within 10.');
    }
    if ((data.operation === 'addition' && data.num1 + data.num2 !== data.answer)
        || (data.operation === 'subtraction' && data.num1 - data.num2 !== data.answer)) {
        throw new ViewValidationError('operations-representation', 'The arithmetic payload is inconsistent.');
    }

    const isAddition = data.operation === 'addition';
    const answerClass = isSolutionView
        ? 'text-emerald-700 border-emerald-700 bg-emerald-50 font-bold'
        : 'text-slate-800 bg-white';

    return (
        <div className="flex justify-center items-center p-7 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[520px]">
                {!isSolutionView && (
                    <div className="text-[1.35rem] font-bold text-slate-700 mb-5 text-center font-sans">
                        Use the objects to solve the equation.
                    </div>
                )}

                <div className="flex items-center justify-center gap-6 min-h-[150px] w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-5">
                    {isAddition ? (
                        <>
                            <div className="flex flex-wrap justify-center max-w-[190px]">
                                {Array.from({length: data.num1}, (_, index) => <Dot key={`a-${index}`} color="bg-sky-300" />)}
                            </div>
                            <div className="text-4xl font-bold text-slate-500">+</div>
                            <div className="flex flex-wrap justify-center max-w-[190px]">
                                {Array.from({length: data.num2}, (_, index) => <Dot key={`b-${index}`} color="bg-amber-300" />)}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-wrap justify-center max-w-[430px]">
                            {Array.from({length: data.num1}, (_, index) => (
                                <Dot
                                    key={`s-${index}`}
                                    color="bg-sky-300"
                                    crossed={index >= data.num1 - data.num2}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 mt-6 text-[2rem] font-extrabold text-slate-700">
                    <span>{data.num1}</span>
                    <span className="text-slate-400">{isAddition ? '+' : '−'}</span>
                    <span>{data.num2}</span>
                    <span className="text-slate-400">=</span>
                    <div className={`w-[76px] h-[58px] border-2 border-slate-600 rounded-lg flex justify-center items-center font-mono ${answerClass}`}>
                        {isSolutionView ? data.answer : ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const OperationsRepresentation = withConfig(OperationsRepresentationViewSchema, OperationsRepresentationCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-representation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsRepresentation payload={payload} />);
    }
};
