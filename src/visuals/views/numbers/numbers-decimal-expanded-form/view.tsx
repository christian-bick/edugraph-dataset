import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {DecimalPlaceValueExpandedProblem} from '../../../../types/problems.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {assertDecimalExpandedProblem, expandedTerm, expandedTermRows, expandedUnit} from '../decimal-expanded-helpers.ts';
import {NumbersDecimalExpandedFormViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-decimal-expanded-form';

function PlaceChart({data}: {data: DecimalPlaceValueExpandedProblem}) {
    return <div className="mt-5 overflow-hidden rounded-xl border-2 border-slate-300">
        <div className="grid bg-slate-100 text-center" style={{gridTemplateColumns: `repeat(${data.places.length}, minmax(0, 1fr))`}}>
            {data.places.map(place => <div key={place.exponent} className={`border-r border-slate-300 px-1 py-3 last:border-r-0 ${place.exponent === 0 ? 'border-l-4 border-l-indigo-400' : ''}`}>
                <div className="text-[11px] font-bold uppercase leading-tight tracking-wide text-slate-600">{place.name.replace('-', ' ')}</div>
                <div className="mt-2 font-mono text-xs font-semibold text-slate-500">{expandedUnit(place)}</div>
            </div>)}
        </div>
        <div className="grid text-center" style={{gridTemplateColumns: `repeat(${data.places.length}, minmax(0, 1fr))`}}>
            {data.places.map(place => <div key={place.exponent} className={`border-r border-t border-slate-300 px-1 py-4 font-mono text-3xl font-black last:border-r-0 ${place.exponent === 0 ? 'border-l-4 border-l-indigo-400' : ''} ${place.digit === 0 ? 'bg-slate-50 text-slate-500' : 'bg-white text-indigo-950'}`}>
                {place.digit}
            </div>)}
        </div>
    </div>;
}

export const NumbersDecimalExpandedFormCore = ({payload}: {
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, [
        'kind', 'base', 'wholePart', 'fractionalDigits', 'fractionalPrecision',
        'valueInThousandths', 'canonicalNumeral', 'places', 'sumTerms'
    ]);
    assertDecimalExpandedProblem(VIEW_ID, data);
    const isSolution = payload.isSolutionView;
    const termRows = expandedTermRows(data.sumTerms);
    const longSum = termRows.length > 1;

    return <main className="rounded-3xl border border-slate-200 bg-white p-7 text-slate-800 shadow-sm" style={{width: 900, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Decimal place values</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Write the decimal in expanded form</h1>
        <p className="mt-2 text-base leading-relaxed">Use the nonzero digits and their place units to write an addition expression. Leave out zero-value terms.</p>
        <div className="mt-5 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-6 py-4 text-center font-mono text-5xl font-black text-indigo-950">
            {data.canonicalNumeral}
        </div>
        <PlaceChart data={data} />
        <div className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-5">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Expanded sum</div>
            <div className={`mt-3 font-mono text-xl font-bold text-slate-900 ${longSum ? '' : 'flex flex-wrap items-center gap-2'}`}>
                <span className={longSum ? 'mb-2 block' : 'mr-1'}>{data.canonicalNumeral} =</span>
                {termRows.map((row, rowIndex) => <div key={row[0].exponent} className={longSum ? 'mb-2 flex items-center gap-2 last:mb-0' : 'contents'}>
                    {row.map((term, index) => <div key={term.exponent} className="inline-flex items-center gap-2">
                        {(rowIndex > 0 || index > 0) && <span className="text-slate-500">+</span>}
                        <span className={`inline-flex min-h-14 min-w-[100px] items-center justify-center rounded-lg border-2 px-3 text-center ${isSolution ? 'border-emerald-400 bg-emerald-50 text-emerald-950' : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'}`}>
                            {isSolution ? expandedTerm(term) : ''}
                        </span>
                    </div>)}
                </div>)}
            </div>
        </div>
    </main>;
};

export const NumbersDecimalExpandedForm = withConfig(
    NumbersDecimalExpandedFormViewSchema,
    NumbersDecimalExpandedFormCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersDecimalExpandedForm payload={payload} />);
    }
};
