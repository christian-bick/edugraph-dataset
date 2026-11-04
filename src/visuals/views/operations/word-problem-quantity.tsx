import {WordProblemQuantity} from './arithmetic-word-problem-helpers.ts';

function QuantityUnit({unit, part}: Pick<WordProblemQuantity, 'unit' | 'part'>) {
    if (unit === 'group') return (
        <svg data-unit="group" aria-hidden="true" width="16" height="16" viewBox="0 0 20 20">
            <path d="M5 8V6a5 5 0 0 1 10 0v2" fill="none" stroke="#92400e" strokeWidth="2" />
            <path d="M2 8h16l-2 10H4Z" fill="#fbbf24" stroke="#92400e" />
        </svg>
    );
    if (unit === 'friend') return (
        <svg data-unit="friend" aria-hidden="true" width="16" height="16" viewBox="0 0 20 20">
            <circle cx="10" cy="4" r="3" fill="#2563eb" />
            <path d="M4 18v-5a6 6 0 0 1 12 0v5Z" fill="#2563eb" />
        </svg>
    );
    return (
        <span data-unit="apple" aria-hidden="true" className={`relative block size-[13px] rounded-full border border-black/15 ${part === 'num2' ? 'bg-green-500' : part === 'num3' ? 'bg-yellow-400' : 'bg-red-500'}`}>
            <span className="absolute -right-px -top-[3px] h-[5px] w-[3px] rotate-45 rounded-full bg-green-700" />
        </span>
    );
}

export function WordProblemQuantityCard({quantity, hidden, highlighted}: {
    quantity: WordProblemQuantity;
    hidden: boolean;
    highlighted: boolean;
}) {
    const columns = quantity.value <= 12 ? 4 : 5;
    // Reserve the same space in both modes, including for larger valid results.
    const height = Math.max(136, 56 + Math.ceil(quantity.value / columns) * 19);
    return (
        <section
            data-quantity={quantity.part}
            aria-label={`${quantity.title}: ${hidden ? 'unknown' : quantity.value}`}
            style={{minHeight: height}}
            className={`flex w-[140px] flex-col items-center justify-center rounded-xl border-2 px-2 py-2 ${
                highlighted ? 'border-emerald-600 bg-emerald-50' : hidden ? 'border-dashed border-slate-400 bg-white' : 'border-slate-300 bg-white'
            }`}
        >
            <div className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-slate-500">{quantity.title}</div>
            {hidden ? <div className="text-3xl font-bold text-slate-400">?</div> : (
                <div className={`grid items-center justify-items-center gap-[3px] ${quantity.value <= 12 ? 'grid-cols-4' : 'grid-cols-5'}`}>
                    {Array.from({length: quantity.value}, (_, index) => <QuantityUnit key={index} unit={quantity.unit} part={quantity.part} />)}
                </div>
            )}
        </section>
    );
}
