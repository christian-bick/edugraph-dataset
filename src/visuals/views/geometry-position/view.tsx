import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {getBallPosition} from './helpers.ts';
import '../../../tailwind.css';

interface Props {
    payload: ViewRenderPayload<'geometry-position'>;
}

export function GeometryPosition({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    const relation = data.relation || 'above';
    const answer = data.answer;

    const promptText = "Where is the ball relative to the box?";
    const options = ['above', 'below', 'nextTo'];

    const pos = getBallPosition(relation);

    const getBtnClass = (opt: string) => {
        let cls = "flex-1 min-w-[120px] py-3 px-2.5 border-2 rounded-lg text-center font-semibold text-[1rem] transition-all duration-200 cursor-pointer ";
        const isCorrect = opt === answer || (opt === 'nextTo' && answer === 'beside');
        if (isCorrect && isSolutionView) {
            cls += "border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold";
        } else {
            cls += "border-slate-200 bg-white text-slate-600";
        }
        return cls;
    };

    const getLabelText = (opt: string) => {
        if (opt === 'nextTo') return 'Next to the box';
        return opt.charAt(0).toUpperCase() + opt.slice(1) + ' the box';
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.3rem] font-bold text-slate-700 mb-[25px] text-center leading-normal">
                    {promptText}
                </div>
                
                <div className="flex justify-center items-center w-[420px] h-[220px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px] p-[15px] box-border">
                    <svg width="300" height="180" className="overflow-visible">
                        {/* Box */}
                        <rect x="100" y="60" width="60" height="60" fill="#e2e8f0" stroke="#475569" strokeWidth="2" rx="4"/>
                        <text x="130" y="95" fill="#475569" fontWeight="bold" fontSize="14" textAnchor="middle">Box</text>
                        {/* Ball */}
                        <circle cx={pos.x} cy={pos.y} r="20" fill="#f43f5e" stroke="#be123c" strokeWidth="2" />
                        <text x={pos.x} y={pos.y + 4} fill="#ffffff" fontWeight="bold" fontSize="12" textAnchor="middle">Ball</text>
                    </svg>
                </div>

                <div className="flex flex-wrap gap-3 w-full justify-center">
                    {options.map((opt, i) => (
                        <div key={i} className={getBtnClass(opt)}>
                            {getLabelText(opt)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'geometry-position'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<GeometryPosition payload={payload} />);
    }
};
