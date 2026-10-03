import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {assertPowerTenPower, PowerTenSymbol} from '../power-ten-presentation.tsx';
import {NumbersPowerTenExponentNotationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-power-ten-exponent-notation';

export const NumbersPowerTenExponentNotationCore = ({payload}: {
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'power']);
    if (data.kind !== 'power-ten-notation') {
        throw new ViewValidationError(VIEW_ID, 'Expected a power-of-ten notation problem.');
    }
    assertPowerTenPower(VIEW_ID, data.power);
    const repeatedForm = data.power.exponent === 2 && payload.seed % 2 === 0;
    const given = repeatedForm ? data.power.repeatedFactors.join(' × ') : `${data.power.value}`;
    const isSolution = payload.isSolutionView;

    return <main className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-800 shadow-sm" style={{width: 650, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Exponent notation</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Write this as a power of ten</h1>
        <p className="mt-2 text-base">Express the given value using base 10 and an exponent.</p>
        <div className="mt-6 rounded-2xl border-2 border-indigo-200 bg-indigo-50 px-5 py-7 text-center">
            <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">Given {repeatedForm ? 'repeated factors' : 'value'}</div>
            <div className="mt-2 font-mono text-4xl font-black text-indigo-950">{given}</div>
        </div>
        <div className={`mt-5 rounded-xl border-2 px-5 py-5 text-center font-mono text-3xl font-bold ${isSolution ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-dashed border-slate-300 bg-white text-slate-600'}`}>
            {isSolution ? <PowerTenSymbol exponent={data.power.exponent} /> : <>10<sup>□</sup></>}
        </div>
        {isSolution && <p className="mt-4 rounded-xl bg-slate-50 px-5 py-4 text-base leading-relaxed">
            {data.power.exponent === 0
                ? <>Zero factors of ten give the empty product 1, so <PowerTenSymbol exponent={0} /> = 1.</>
                : <>{data.power.exponent} factor{data.power.exponent === 1 ? '' : 's'} of ten: {data.power.repeatedFactors.join(' × ')} = {data.power.value}. Therefore the exponent is {data.power.exponent}.</>}
        </p>}
    </main>;
};

export const NumbersPowerTenExponentNotation = withConfig(
    NumbersPowerTenExponentNotationViewSchema,
    NumbersPowerTenExponentNotationCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersPowerTenExponentNotation payload={payload} />);
    }
};
