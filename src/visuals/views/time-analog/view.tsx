import {Ability} from 'edugraph-ts';
import {useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {formatTime, getClockAngles, getTickMarks} from './helpers.ts';
import { TimeAnalogViewConfig, TimeAnalogViewSchema } from './spec.ts';
import { withConfig } from '../withConfig.tsx';
import { validateProblemData } from '../../helpers/validation.ts';
import '../../../tailwind.css';

interface CoreProps {
    config: TimeAnalogViewConfig;
    payload: ViewRenderPayload<'time-analog'>;
}

const TimeAnalogCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    
    validateProblemData('time-analog', data, ['time', 'interval']);

    const isReverse = config.isReverse;

    const showHands = !isReverse || isSolutionView;
    const showTime = isReverse || isSolutionView;

    const isClockSolution = isReverse && isSolutionView;
    const isTextSolution = !isReverse && isSolutionView;

    const formattedTime = useMemo(() => {
        return formatTime(data.time, data.interval);
    }, [data.time, data.interval]);

    const angles = useMemo(() => {
        return getClockAngles(data.time);
    }, [data.time]);

    const tickMarks = useMemo(() => {
        return getTickMarks();
    }, []);

    const handColorClass = isClockSolution ? 'stroke-emerald-600' : 'stroke-neutral-800';

    return (
        <div className="flex justify-center items-center p-5 bg-white w-fit">
            <div className="flex flex-col items-center gap-5">
                <svg className="w-[200px] h-[200px]" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-neutral-800 stroke-[2px]" cx="50" cy="50" r="45" />
                    {tickMarks.map((mark, i) => {
                        if (mark.isFive) {
                            return <circle key={i} cx={mark.x} cy={mark.y} r={2} className="fill-neutral-800" />;
                        } else {
                            return <circle key={i} cx={mark.x} cy={mark.y} r={1} className="fill-neutral-500" />;
                        }
                    })}
                    
                    {showHands && (
                        <>
                            {/* Hour hand */}
                            <line 
                                className={`stroke-linecap-round stroke-[4px] ${handColorClass}`} 
                                x1="50" 
                                y1="50" 
                                x2="50" 
                                y2="25" 
                                transform={`rotate(${angles.hourAngle} 50 50)`} 
                            />
                            {/* Minute hand */}
                            <line 
                                className={`stroke-linecap-round stroke-[3px] ${handColorClass}`} 
                                x1="50" 
                                y1="50" 
                                x2="50" 
                                y2="15" 
                                transform={`rotate(${angles.minuteAngle} 50 50)`} 
                            />
                            {/* Second hand */}
                            {data.interval < 60 && (
                                <line 
                                    className={`stroke-linecap-round stroke-[1.5px] ${handColorClass}`} 
                                    x1="50" 
                                    y1="50" 
                                    x2="50" 
                                    y2="10" 
                                    transform={`rotate(${angles.secondAngle} 50 50)`} 
                                />
                            )}
                        </>
                    )}
                </svg>

                <div className={`border-2 border-neutral-800 rounded-md py-2 px-[15px] min-w-[100px] min-h-[50px] text-center font-mono flex items-center justify-center text-[1.5rem] ${
                    isReverse ? 'border-dashed' : ''
                } ${
                    isTextSolution ? 'text-emerald-700 border-emerald-600 bg-emerald-50 font-bold' : ''
                }`}>
                    {showTime ? formattedTime : ''}
                </div>
            </div>
        </div>
    );
};

export const TimeAnalog = withConfig(TimeAnalogViewSchema, TimeAnalogCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'time-analog'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<TimeAnalog payload={payload} />);
    }
};
