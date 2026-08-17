import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ViewValidationError, validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    isMultiDigitWritingProblem,
    PlaceValueStrip,
    validateMultiDigitWritingProblem
} from '../writing-view-helpers.tsx';
import {numberToEnglishName} from '../numbers-read-standard/helpers.ts';
import {NumbersWriteNameViewConfig, NumbersWriteNameViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: NumbersWriteNameViewConfig;
    payload: ViewRenderPayload<'numbers-write-name'>;
}

function MultiDigitNumberNameTask({
    data,
    isSolutionView
}: {
    data: Extract<ViewRenderPayload<'numbers-write-name'>['problem']['data'], {task: 'multi-digit-number-name'}>;
    isSolutionView: boolean;
}) {
    return (
        <div className="w-[760px] rounded-2xl bg-white p-8 font-sans shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col items-center gap-5">
                <div className="text-center text-xl font-semibold text-slate-700">{data.prompt}</div>
                <div className="flex min-h-28 min-w-72 items-center justify-center rounded-2xl border-2 border-sky-300 bg-sky-50 px-10 font-mono text-6xl font-extrabold tracking-wide text-slate-800">
                    {data.standardNumeral}
                </div>
                <PlaceValueStrip placeValues={data.placeValues} />
                <div className={`flex min-h-28 w-full items-center justify-center rounded-xl border-2 px-8 text-center text-[1.7rem] font-semibold leading-snug ${
                    isSolutionView
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-dashed border-slate-400 bg-white text-slate-700'
                }`}>
                    {isSolutionView ? data.numberName : ''}
                </div>
            </div>
        </div>
    );
}

const NumbersWriteNameCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('numbers-write-name', data, ['number']);

    if (isMultiDigitWritingProblem(data)) {
        if (data.task !== 'multi-digit-number-name') {
            throw new ViewValidationError(
                'numbers-write-name',
                "Expected task 'multi-digit-number-name'."
            );
        }
        validateProblemData('numbers-write-name', data, [
            'task',
            'number',
            'standardNumeral',
            'numberName',
            'placeValues',
            'prompt'
        ]);
        validateMultiDigitWritingProblem(
            'numbers-write-name',
            data,
            'multi-digit-number-name'
        );
        return <MultiDigitNumberNameTask data={data} isSolutionView={isSolutionView} />;
    }

    if (!Number.isInteger(data.number) || data.number < 0 || data.number > 1000) {
        throw new ViewValidationError('numbers-write-name', 'Expected an integer from 0 through 1000.');
    }
    const numberName = numberToEnglishName(data.number);

    return (
        <div className="w-[680px] rounded-2xl bg-white p-8 font-sans shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">Number name</div>
                <div className="mt-2 text-xl font-semibold text-slate-700">Write this numeral in words.</div>
            </div>
            <div className="mt-6 flex justify-center">
                <div className="flex min-h-28 min-w-52 items-center justify-center rounded-2xl border-2 border-sky-300 bg-sky-50 px-8 text-6xl font-extrabold text-slate-800">
                    {data.number}
                </div>
            </div>
            <div className={`mt-6 flex min-h-24 items-center justify-center rounded-xl border-2 px-8 text-center text-2xl font-semibold ${
                isSolutionView
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-dashed border-slate-400 bg-white text-slate-700'
            }`}>
                {isSolutionView ? numberName : ''}
            </div>
        </div>
    );
};

export const NumbersWriteName = withConfig(NumbersWriteNameViewSchema, NumbersWriteNameCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-write-name'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersWriteName payload={payload} />);
    }
};
