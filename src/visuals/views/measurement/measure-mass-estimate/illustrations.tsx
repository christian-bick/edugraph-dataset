import type {MassEstimateProblem} from '../../../../types/problems.ts';

export const TargetObject = ({object}: {object: MassEstimateProblem['object']}) => {
    if (object === 'crayon') return <g transform="rotate(35 140 105)">
        <path d="M115 58 L140 12 L165 58 V190 H115 Z" fill="#fb7185" stroke="#9f1239" strokeWidth="5" strokeLinejoin="round" />
        <path d="M128 35 L140 12 L152 35 Z" fill="#9f1239" />
        <path d="M115 74 H165 V167 H115 Z" fill="#fecdd3" stroke="#9f1239" strokeWidth="5" />
        <path d="M125 89 H155 M125 151 H155" stroke="#9f1239" strokeWidth="4" />
    </g>;
    if (object === 'apple') return <g>
        <path d="M140 58 Q131 29 153 15" fill="none" stroke="#78350f" strokeWidth="7" strokeLinecap="round" />
        <path d="M143 35 Q174 11 190 34 Q168 52 143 35" fill="#22c55e" stroke="#166534" strokeWidth="4" />
        <path d="M140 65 C85 32 43 87 64 143 C79 187 115 202 140 182 C165 202 201 187 216 143 C237 87 195 32 140 65 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="6" />
        <path d="M91 83 Q74 98 81 119" fill="none" stroke="#fca5a5" strokeWidth="9" strokeLinecap="round" />
    </g>;
    if (object === 'book') return <g>
        <path d="M68 28 H219 V177 H68 Q51 177 51 160 V45 Q51 28 68 28 Z" fill="#818cf8" stroke="#3730a3" strokeWidth="6" />
        <path d="M70 177 H219 V192 H70 Q51 192 51 177 Q51 163 70 163 H219" fill="#f8fafc" stroke="#3730a3" strokeWidth="6" />
        <path d="M82 28 V162 M106 72 H190 M106 100 H178" fill="none" stroke="#3730a3" strokeWidth="5" strokeLinecap="round" />
    </g>;
    if (object === 'backpack') return <g>
        <path d="M90 67 Q90 23 140 23 Q190 23 190 67" fill="none" stroke="#7c2d12" strokeWidth="10" />
        <rect x="56" y="52" width="168" height="148" rx="34" fill="#fb923c" stroke="#9a3412" strokeWidth="6" />
        <path d="M76 92 H204" stroke="#9a3412" strokeWidth="5" />
        <rect x="87" y="118" width="106" height="61" rx="19" fill="#fdba74" stroke="#9a3412" strokeWidth="5" />
        <path d="M97 136 H183" stroke="#9a3412" strokeWidth="4" />
    </g>;
    if (object === 'chair') return <g stroke="#92400e" strokeWidth="6" strokeLinejoin="round">
        <path d="M83 116 V27 Q83 17 93 17 H190 Q200 17 200 27 V116" fill="#fcd34d" />
        <path d="M108 25 V104 M140 25 V104 M173 25 V104" strokeWidth="4" />
        <path d="M67 116 H214 L224 142 H57 Z" fill="#f59e0b" />
        <path d="M76 142 L65 200 M207 142 L218 200 M94 142 V184 M189 142 V184" fill="none" strokeWidth="9" />
    </g>;
    return <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="59" cy="153" r="43" stroke="#334155" strokeWidth="7" />
        <circle cx="222" cy="153" r="43" stroke="#334155" strokeWidth="7" />
        <path d="M59 153 L106 81 L151 153 Z M106 81 H189 L151 153 M189 81 L222 153 M189 81 L182 51 H207" stroke="#0891b2" strokeWidth="7" />
        <path d="M98 64 H120 M108 64 L106 81 M151 153 L169 162 H182" stroke="#334155" strokeWidth="6" />
        <circle cx="151" cy="153" r="9" stroke="#334155" strokeWidth="5" />
    </g>;
};

/** Groups only the provided reference collection; it never infers mass from picture size. */
export function referenceGroups(referenceCount: number, unit: MassEstimateProblem['unit']): number[] {
    const groupSize = unit === 'g' && referenceCount >= 100 ? 100 : 1;
    return [
        ...Array.from({length: Math.floor(referenceCount / groupSize)}, () => groupSize),
        ...Array.from({length: referenceCount % groupSize}, () => 1)
    ];
}

const Paperclip = () => <path
    d="M27 7 C39 7 42 19 34 27 L17 44 C7 54 -5 42 5 32 L24 13 C30 7 38 15 32 21 L13 40"
    fill="none" stroke="#475569" strokeWidth="3.5" strokeLinecap="round"
/>;

export const ReferenceObjects = ({referenceCount, unit}: Pick<MassEstimateProblem, 'referenceCount' | 'unit'>) => {
    const groups = referenceGroups(referenceCount, unit);
    const boxed = groups.some(count => count > 1);
    const columns = boxed ? 2 : unit === 'g' ? 5 : Math.min(4, groups.length);
    const width = boxed ? 120 : unit === 'g' ? 45 : 59;
    const height = boxed ? 64 : unit === 'g' ? 70 : 68;
    const rows = Math.ceil(groups.length / columns);
    const left = (260 - Math.min(columns, groups.length) * width) / 2;
    const top = (210 - rows * height) / 2;
    return <svg viewBox="0 0 260 210" className="h-[190px] w-full" role="img"
        aria-label={unit === 'kg' ? 'One-kilogram reference bags' : 'One-gram reference paperclips'}>
        {groups.map((count, index) => <g key={index} data-reference-count={count}
            transform={`translate(${left + index % columns * width} ${top + Math.floor(index / columns) * height})`}>
            {unit === 'kg' ? <g>
                <path d="M17 6 H39 L44 18 L49 59 H7 L12 18 Z" fill="#fef3c7" stroke="#a16207" strokeWidth="3" strokeLinejoin="round" />
                <path d="M12 18 H44" stroke="#a16207" strokeWidth="3" />
                <text x="28" y="43" textAnchor="middle" fill="#78350f" fontSize="13" fontWeight="800">1 kg</text>
            </g> : count === 1 ? <g transform="translate(5 9)"><Paperclip /></g> : <g>
                <rect x="3" y="3" width="111" height="56" rx="6" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
                {[22, 48, 74].map(x => <g key={x} transform={`translate(${x} 5) scale(.55)`}><Paperclip /></g>)}
                <text x="59" y="49" textAnchor="middle" fill="#334155" fontSize="12" fontWeight="700">100 paperclips</text>
            </g>}
        </g>)}
    </svg>;
};
