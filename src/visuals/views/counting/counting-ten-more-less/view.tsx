import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {PlaceValueParts, analyzeTenStepProblem} from './helpers.ts';
import {CountingTenMoreLessViewConfig, CountingTenMoreLessViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: CountingTenMoreLessViewConfig;
    payload: ViewRenderPayload<'counting-ten-more-less'>;
}

function TenBundles({count, highlighted}: {count: number; highlighted: boolean}) {
    return (
        <div className="grid min-h-[46px] grid-cols-5 place-content-center gap-1.5" aria-label={`${count} ten bundles`}>
            {Array.from({length: count}, (_, index) => (
                <span
                    key={index}
                    className={`h-[42px] w-[13px] rounded-sm border-2 ${
                        highlighted
                            ? 'border-emerald-700 bg-emerald-200'
                            : 'border-sky-700 bg-sky-200'
                    }`}
                />
            ))}
        </div>
    );
}

function Hundreds({count, highlighted}: {count: number; highlighted: boolean}) {
    return (
        <div className="grid min-h-[54px] grid-cols-3 place-content-center gap-1" aria-label={`${count} hundred blocks`}>
            {Array.from({length: count}, (_, index) => (
                <span key={index} className={`size-6 border-2 ${
                    highlighted ? 'border-emerald-700 bg-emerald-200' : 'border-indigo-600 bg-indigo-100'
                }`} />
            ))}
        </div>
    );
}

function CompactTens({count, highlighted}: {count: number; highlighted: boolean}) {
    return (
        <div className="grid min-h-[54px] grid-cols-5 place-content-center items-end gap-1" aria-label={`${count} ten bundles`}>
            {Array.from({length: count}, (_, index) => (
                <span key={index} className={`h-9 w-2 border-2 ${
                    highlighted ? 'border-emerald-700 bg-emerald-200' : 'border-sky-700 bg-sky-200'
                }`} />
            ))}
        </div>
    );
}

function Ones({count}: {count: number}) {
    return (
        <div className="grid min-h-[54px] grid-cols-5 place-content-center gap-1" aria-label={`${count} ones`}>
            {Array.from({length: count}, (_, index) => (
                <span key={index} className="size-3 rounded-sm border border-amber-700 bg-amber-200" />
            ))}
        </div>
    );
}

function PlaceValuePanel({
    label,
    value,
    parts,
    revealTens,
    highlighted
}: {
    label: string;
    value: number;
    parts: PlaceValueParts;
    revealTens: boolean;
    highlighted: boolean;
}) {
    const resultClass = highlighted ? 'text-emerald-700' : 'text-slate-800';

    return (
        <div className={`flex w-[250px] flex-col items-center gap-3 rounded-2xl border-2 p-4 ${
            highlighted ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-slate-50'
        }`}>
            <div className="text-sm font-bold uppercase tracking-wider text-slate-500">{label}</div>
            <div className={`h-[54px] text-[2.75rem] font-extrabold leading-[54px] ${resultClass}`}>
                {revealTens ? value : '?'}
            </div>
            <div className="grid w-full grid-cols-2 overflow-hidden rounded-xl border-2 border-slate-300 bg-white">
                <div className="flex min-h-[132px] flex-col items-center justify-between gap-2 border-r-2 border-slate-300 p-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Tens</span>
                    {revealTens ? (
                        <>
                            <TenBundles count={parts.tens} highlighted={highlighted}/>
                            <span className={`text-xl font-bold ${resultClass}`}>{parts.tens} tens</span>
                        </>
                    ) : (
                        <span className="my-auto text-4xl font-bold text-slate-400">?</span>
                    )}
                </div>
                <div className="flex min-h-[132px] flex-col items-center justify-between gap-2 p-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Ones</span>
                    <div className="flex min-h-[46px] items-center text-[2.5rem] font-extrabold text-indigo-700">
                        {parts.ones}
                    </div>
                    <span className="text-xl font-bold text-indigo-700">
                        {parts.ones} {parts.ones === 1 ? 'one' : 'ones'}
                    </span>
                </div>
            </div>
        </div>
    );
}

function ExtendedPlaceValuePanel({
    label,
    value,
    parts,
    reveal,
    highlighted
}: {
    label: string;
    value: number;
    parts: PlaceValueParts;
    reveal: boolean;
    highlighted: boolean;
}) {
    const resultClass = highlighted ? 'text-emerald-700' : 'text-slate-800';
    const cells = [
        {label: 'Hundreds', value: parts.hundreds ?? 0, blocks: <Hundreds count={parts.hundreds ?? 0} highlighted={highlighted}/>},
        {label: 'Tens', value: parts.tens, blocks: <CompactTens count={parts.tens} highlighted={highlighted}/>},
        {label: 'Ones', value: parts.ones, blocks: <Ones count={parts.ones}/>}
    ];

    return (
        <div className={`flex w-[260px] flex-col items-center gap-3 rounded-2xl border-2 p-4 ${
            highlighted ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-slate-50'
        }`}>
            <div className="text-sm font-bold uppercase tracking-wider text-slate-500">{label}</div>
            <div className={`h-[54px] text-[2.75rem] font-extrabold leading-[54px] ${resultClass}`}>
                {reveal ? value : '?'}
            </div>
            <div className="grid w-full grid-cols-3 overflow-hidden rounded-xl border-2 border-slate-300 bg-white">
                {cells.map((cell, index) => (
                    <div key={cell.label} className={`flex min-h-[132px] flex-col items-center justify-between gap-2 p-2 ${index < 2 ? 'border-r-2 border-slate-300' : ''}`}>
                        <span className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">{cell.label}</span>
                        {reveal ? cell.blocks : <span className="my-auto text-4xl font-bold text-slate-400">?</span>}
                        <span className={`text-lg font-bold ${cell.label === 'Ones' ? 'text-amber-800' : resultClass}`}>
                            {reveal ? cell.value : '?'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const CountingTenMoreLessCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('counting-ten-more-less', data, [
        'numObjects',
        'incDecType',
        'incDecAnswer',
        'simpleAnswer',
        'stepSize',
        'startPlaceValue',
        'resultPlaceValue'
    ]);

    const analysis = analyzeTenStepProblem(data);
    const isIncrement = analysis.direction === 'inc';
    const unit = analysis.stepSize === 100 ? 'hundred' : 'ten';
    const prompt = `Find ${analysis.stepSize} ${isIncrement ? 'more' : 'less'}.`;
    const dynamicStepLabel = `${isIncrement ? '+' : '−'} 1 ${unit}`;
    const useHundreds = analysis.startParts.hundreds !== undefined;

    return (
        <div className="flex w-fit items-center justify-center rounded-2xl bg-white p-[30px] font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex w-[680px] flex-col items-center gap-5">
                <div className="flex h-[34px] items-center justify-center text-[1.35rem] font-bold text-slate-700">
                    {isSolutionView ? '' : prompt}
                </div>

                <div className="flex items-center gap-3">
                    {useHundreds ? (
                        <ExtendedPlaceValuePanel label="Start" value={analysis.start} parts={analysis.startParts} reveal highlighted={false}/>
                    ) : (
                        <PlaceValuePanel label="Start" value={analysis.start} parts={analysis.startParts} revealTens highlighted={false}/>
                    )}

                    <div className="flex w-[112px] flex-col items-center gap-2">
                        <span className="text-4xl font-bold text-slate-400">→</span>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-lg font-bold text-amber-800">
                            {dynamicStepLabel}
                        </span>
                    </div>

                    {useHundreds ? (
                        <ExtendedPlaceValuePanel label="Result" value={analysis.result} parts={analysis.resultParts} reveal={isSolutionView} highlighted={isSolutionView}/>
                    ) : (
                        <PlaceValuePanel label="Result" value={analysis.result} parts={analysis.resultParts} revealTens={isSolutionView} highlighted={isSolutionView}/>
                    )}
                </div>

                <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 px-6 py-3 text-xl font-bold text-indigo-800">
                    {analysis.stepSize === 100
                        ? `Tens and ones stay the same: ${analysis.startParts.tens}${analysis.startParts.ones} = ${analysis.resultParts.tens}${analysis.resultParts.ones}`
                        : `Ones stay the same: ${analysis.startParts.ones} = ${analysis.resultParts.ones}`}
                </div>
            </div>
        </div>
    );
};

export const CountingTenMoreLess = withConfig(CountingTenMoreLessViewSchema, CountingTenMoreLessCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'counting-ten-more-less'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<CountingTenMoreLess payload={payload}/>);
    }
};
