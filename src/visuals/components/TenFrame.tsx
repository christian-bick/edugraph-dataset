export function TenFrame({ filledCount, colorClass }: { filledCount: number; colorClass: 'color-a' | 'color-b' }) {
    const dotClass = colorClass === 'color-a'
        ? 'w-[22px] h-[22px] rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_2px_4px_rgba(190,18,60,0.3)]'
        : 'w-[22px] h-[22px] rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_2px_4px_rgba(217,119,6,0.3)]';

    return (
        <div className="grid grid-cols-5 grid-rows-2 gap-[3px] border-2 border-slate-600 bg-white rounded-md overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => {
                const isFilled = i < filledCount;
                return (
                    <div key={i} className="w-8 h-8 border-[0.5px] border-slate-100 flex justify-center items-center">
                        {isFilled && <div className={dotClass} />}
                    </div>
                );
            })}
        </div>
    );
}
