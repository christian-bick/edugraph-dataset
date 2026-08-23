import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    MeasureLengthDifferenceViewConfig,
    MeasureLengthDifferenceViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasureLengthDifferenceViewConfig;
    payload: ViewRenderPayload<'measure-length-difference'>;
}

function Bar({length, color}: {length: number; color: string}) {
    return (
        <div
            className="h-12 rounded-r-lg"
            style={{width: `${length * 20}px`, background: color}}
        />
    );
}

const MeasureLengthDifferenceCore = ({config: _config, payload}: CoreProps) => {
    const data = payload.problem.data;
    validateProblemData('measure-length-difference', data, [
        'longerLength',
        'shorterLength',
        'difference',
        'unitId'
    ]);
    if (data.unitId !== 'centimeter'
        || data.longerLength <= data.shorterLength
        || data.difference !== data.longerLength - data.shorterLength) {
        throw new ViewValidationError(
            'measure-length-difference',
            'Expected a coherent positive length difference measured in centimeters.'
        );
    }

    return (
        <div className="w-[650px] rounded-2xl bg-white p-8 font-sans">
            <h2 className="text-center text-xl font-bold text-slate-800">
                How much longer is A than B?
            </h2>
            <div className="mt-7 space-y-5">
                <div className="flex items-center gap-4">
                    <b className="w-6">A</b>
                    <Bar length={data.longerLength} color="#fb7185"/>
                    <span>{data.longerLength} cm</span>
                </div>
                <div className="flex items-center gap-4">
                    <b className="w-6">B</b>
                    <Bar length={data.shorterLength} color="#60a5fa"/>
                    <span>{data.shorterLength} cm</span>
                </div>
            </div>
            <div className="mx-auto mt-7 flex h-16 w-56 items-center justify-center rounded-xl border-2 border-slate-700 text-xl font-bold text-emerald-700">
                {payload.isSolutionView ? `${data.difference} cm` : ''}
            </div>
        </div>
    );
};

export const MeasureLengthDifference = withConfig(
    MeasureLengthDifferenceViewSchema,
    MeasureLengthDifferenceCore
);

let root: ReturnType<typeof createRoot> | null = null;
if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'measure-length-difference'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<MeasureLengthDifference payload={payload}/>);
        }
    };
}
