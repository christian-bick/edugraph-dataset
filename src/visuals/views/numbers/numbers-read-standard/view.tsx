import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ViewValidationError, validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {numberToEnglishName} from './helpers.ts';
import {NumbersReadStandardViewConfig, NumbersReadStandardViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: NumbersReadStandardViewConfig;
    payload: ViewRenderPayload<'numbers-read-standard'>;
}

const NumbersReadStandardCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('numbers-read-standard', data, ['number']);

    const number = data.number;
    if (!Number.isInteger(number) || number < 0 || number > 120) {
        throw new ViewValidationError(
            'numbers-read-standard',
            `Expected an integer from 0 through 120, received ${number}`
        );
    }

    const numberName = numberToEnglishName(number);

    return (
        <div className="flex w-fit items-center justify-center rounded-2xl bg-white p-[30px] font-sans shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
            <div className="flex w-[560px] flex-col items-center gap-5">
                <div className="flex h-[42px] items-center justify-center text-xl font-bold text-slate-700">
                    {isSolutionView ? '' : 'Read this number aloud.'}
                </div>

                <div className="flex h-[120px] min-w-[180px] items-center justify-center rounded-2xl border-2 border-sky-300 bg-sky-50 px-8 text-[4.5rem] font-extrabold leading-none text-slate-800">
                    {number}
                </div>

                <div
                    aria-label="Spoken English number name answer"
                    className={`relative flex min-h-[86px] w-full items-center justify-center rounded-[2rem] border-[2.5px] px-6 text-center text-[2rem] font-semibold ${
                        isSolutionView
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-dashed border-slate-500 bg-white text-slate-800'
                    }`}
                >
                    <span
                        aria-hidden="true"
                        className={`absolute -left-[10px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rotate-45 border-b-[2.5px] border-l-[2.5px] ${
                            isSolutionView
                                ? 'border-emerald-600 bg-emerald-50'
                                : 'border-slate-500 bg-white'
                        }`}
                    />
                    {isSolutionView ? numberName : ''}
                </div>
            </div>
        </div>
    );
};

export const NumbersReadStandard = withConfig(NumbersReadStandardViewSchema, NumbersReadStandardCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-read-standard'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<NumbersReadStandard payload={payload} />);
    }
};
