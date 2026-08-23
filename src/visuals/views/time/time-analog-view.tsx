import {useMemo} from 'react';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {formatDayPeriod, validateTimeProblem} from './time-presentation.ts';
import {formatTime, getClockAngles, getTickMarks} from './time-analog/helpers.ts';

export type TimeAnalogViewId = 'time-analog' | 'time-analog-construction';

interface TimeAnalogViewProps {
    mode: 'reading' | 'construction';
    payload: ViewRenderPayload<TimeAnalogViewId>;
    viewId: TimeAnalogViewId;
}

export const TimeAnalogView = ({mode, payload, viewId}: TimeAnalogViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateTimeProblem(viewId, data);

    const isConstruction = mode === 'construction';
    const showHands = !isConstruction || isSolutionView;
    const showTime = isConstruction || isSolutionView;
    const isClockSolution = isConstruction && isSolutionView;
    const formattedTime = useMemo(
        () => formatTime(data.secondsSinceMidnight, data.intervalSeconds),
        [data.secondsSinceMidnight, data.intervalSeconds]
    );
    const periodLabel = formatDayPeriod(data.period);
    const displayedTime = periodLabel === undefined
        ? formattedTime
        : `${formattedTime} ${periodLabel}`;
    const angles = useMemo(
        () => getClockAngles(data.secondsSinceMidnight),
        [data.secondsSinceMidnight]
    );
    const tickMarks = useMemo(() => getTickMarks(), []);
    const hourHandClass = isClockSolution ? 'stroke-indigo-700' : 'stroke-neutral-800';
    const minuteHandClass = isClockSolution ? 'stroke-emerald-600' : 'stroke-neutral-800';

    return (
        <div className="flex w-full items-center justify-center bg-white p-5 font-sans">
            <div className="flex w-[480px] flex-col items-center gap-5">
                {!isSolutionView && (
                    <div className="text-center text-[1.4rem] font-bold leading-relaxed text-slate-700">
                        {isConstruction ? 'What time should the clock show?' : 'What time is it?'}
                    </div>
                )}
                {periodLabel !== undefined && !isConstruction && (
                    <div className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-[1.05rem] font-bold text-indigo-800">
                        Period: {periodLabel}
                    </div>
                )}
                <svg className="h-[200px] w-[200px]" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-neutral-800 stroke-[2px]" cx="50" cy="50" r="45" />
                    {tickMarks.map((mark, index) => mark.isFive
                        ? <circle key={index} cx={mark.x} cy={mark.y} r={2} className="fill-neutral-800" />
                        : <circle key={index} cx={mark.x} cy={mark.y} r={1} className="fill-neutral-500" />
                    )}
                    {showHands && (
                        <>
                            <line
                                className={`stroke-linecap-round stroke-[4px] ${hourHandClass}`}
                                x1="50"
                                y1="50"
                                x2="50"
                                y2="25"
                                transform={`rotate(${angles.hourAngle} 50 50)`}
                            />
                            <line
                                className={`stroke-linecap-round stroke-[3px] ${minuteHandClass}`}
                                x1="50"
                                y1="50"
                                x2="50"
                                y2="15"
                                transform={`rotate(${angles.minuteAngle} 50 50)`}
                            />
                            {data.intervalSeconds < 60 && (
                                <line
                                    className="stroke-linecap-round stroke-[1.5px] stroke-rose-500"
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
                {isClockSolution && (
                    <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="text-indigo-700">Short indigo hand = hour</span>
                        <span className="text-emerald-700">Long green hand = minute</span>
                    </div>
                )}
                <div className={`flex min-h-[50px] min-w-[100px] items-center justify-center rounded-md border-2 border-neutral-800 px-[15px] py-2 text-center font-mono text-[1.5rem] ${
                    isConstruction && !isSolutionView ? 'border-dashed' : ''
                } ${
                    isSolutionView ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-700' : ''
                }`}>
                    {showTime ? displayedTime : ''}
                </div>
            </div>
        </div>
    );
};
