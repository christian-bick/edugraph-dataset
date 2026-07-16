import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import '../../../tailwind.css';

interface Props {
    payload: ViewRenderPayload<'geometry-env-shapes'>;
}

export function GeometryEnvShapes({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    const target = data.target || 'clock';
    const answer = data.answer;

    const promptText = `What shape is the ${target}?`;
    const options = ['circle', 'square', 'rectangle'];

    const getBtnClass = (opt: string) => {
        let cls = "flex-1 min-w-[120px] py-3 px-2.5 border-2 rounded-lg text-center font-semibold text-[1rem] transition-all duration-200 cursor-pointer ";
        if (opt === answer && isSolutionView) {
            cls += "border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold";
        } else {
            cls += "border-slate-200 bg-white text-slate-600";
        }
        return cls;
    };

    const getLabelText = (opt: string) => {
        return opt.charAt(0).toUpperCase() + opt.slice(1);
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.3rem] font-bold text-slate-700 mb-[25px] text-center leading-normal">
                    {promptText}
                </div>
                
                <div className="flex justify-center items-center w-[420px] h-[220px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px] p-[15px] box-border">
                    <div className="relative w-[320px] h-[180px] bg-sky-100 border-[2.5px] border-sky-600 rounded-lg overflow-hidden">
                        {/* Table */}
                        <div className="absolute bottom-0 left-[60px] width-[200px] height-[50px] bg-[#8b5a2b] border-2 border-[#5c3a21] rounded" style={{ width: '200px', height: '50px' }}></div>
                        <div className="absolute bottom-0 left-[75px] w-3 h-[35px] bg-[#5c3a21]"></div>
                        <div className="absolute bottom-0 right-[75px] w-3 h-[35px] bg-[#5c3a21]"></div>
                        {/* Window */}
                        <div className="absolute top-[15px] left-[30px] w-[50px] h-[50px] bg-white border-3 border-slate-500 grid grid-cols-2 grid-rows-2 gap-[2px]">
                            <div className="bg-sky-200"></div><div className="bg-sky-200"></div>
                            <div className="bg-sky-200"></div><div className="bg-sky-200"></div>
                        </div>
                        {/* Clock */}
                        <div className="absolute top-[20px] right-[40px] w-[45px] h-[45px] rounded-full bg-white border-[3.5px] border-red-500 flex justify-center items-center font-bold text-[8px] text-slate-700">12</div>
                    </div>
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

window.renderView = (payload: ViewRenderPayload<'geometry-env-shapes'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<GeometryEnvShapes payload={payload} />);
    }
};
