import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../types/ml-engine.ts';
import { generateScatteredPositions } from './helpers.ts';
import '../../../tailwind.css';

interface Item {
    shape: string;
    color: string;
}

const COLOR_MAP: Record<string, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#14b8a6'
};

interface Props {
    payload: ViewRenderPayload<'sorting-classify-count'>;
}

function ItemSVG({ item, size = 40 }: { item: Item; size?: number }) {
    const fill = COLOR_MAP[item.color] || '#334155';
    const stroke = '#1e293b';
    const strokeWidth = 2;

    if (item.shape === 'square') {
        return (
            <svg width={size} height={size} viewBox="0 0 40 40">
                <rect x="4" y="4" width="32" height="32" rx="4" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            </svg>
        );
    } else if (item.shape === 'triangle') {
        return (
            <svg width={size} height={size} viewBox="0 0 40 40">
                <polygon points="20,4 36,36 4,36" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            </svg>
        );
    } else {
        return (
            <svg width={size} height={size} viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            </svg>
        );
    }
}

export function SortingClassifyCount({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    const classifyType = data.classifyType || 'shape';

    const { items, categories } = useMemo(() => {
        const itemsList = [...(data.items || [])];
        const categoriesMap = { ...(data.categories || {}) };

        if (itemsList.length === 0) {
            const numObjects = data.numObjects || 8;
            const shapes = ['circle', 'square', 'triangle'];
            const colors = ['red', 'blue', 'green'];
            
            let seed = Array.from(problem.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const nextRand = () => {
                const x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            };

            for (let i = 0; i < numObjects; i++) {
                const shape = shapes[Math.floor(nextRand() * shapes.length)];
                const color = colors[Math.floor(nextRand() * colors.length)];
                itemsList.push({ shape, color });
                const key = classifyType === 'shape' ? shape : color;
                categoriesMap[key] = (categoriesMap[key] || 0) + 1;
            }
            
            const possible = classifyType === 'shape' ? shapes : colors;
            possible.forEach(cat => {
                if (categoriesMap[cat] === undefined) categoriesMap[cat] = 0;
            });
        }
        return { items: itemsList, categories: categoriesMap };
    }, [data.items, data.categories, data.numObjects, problem.id, classifyType]);

    const positions = useMemo(() => {
        return generateScatteredPositions(items.length, problem.id);
    }, [items.length, problem.id]);

    const possibleCategories = useMemo(() => {
        return classifyType === 'shape' ? ['circle', 'square', 'triangle'] : ['red', 'blue', 'green'];
    }, [classifyType]);

    const promptText = `Classify and count the objects by ${classifyType}.`;

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.4rem] font-bold text-slate-700 mb-5 text-center leading-relaxed">
                    {promptText}
                </div>
                
                <div className="relative w-[450px] h-[160px] bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden mb-[25px]">
                    {positions.map((pos, i) => (
                        <div 
                            key={i}
                            className="absolute w-10 h-10 flex justify-center items-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                        >
                            <ItemSVG item={items[i]} />
                        </div>
                    ))}
                </div>

                <div className="w-full flex flex-col gap-[15px]">
                    {possibleCategories.map(cat => {
                        const count = categories[cat] || 0;
                        const labelText = cat.charAt(0).toUpperCase() + cat.slice(1);
                        
                        const catItem = classifyType === 'shape' 
                            ? { shape: cat, color: 'blue' } 
                            : { shape: 'circle', color: cat };

                        return (
                            <div key={cat} className="flex justify-between items-center bg-slate-50 py-2.5 px-5 border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-[15px] text-[1.2rem] font-bold text-slate-600">
                                    <ItemSVG item={catItem} size={30} />
                                    <span>{labelText}</span>
                                </div>
                                <div className={`w-[50px] h-[45px] border-2 border-slate-600 rounded bg-white flex justify-center items-center text-[1.4rem] font-mono font-extrabold ${
                                    isSolutionView 
                                        ? 'text-green-600 border-green-600 bg-green-50' 
                                        : 'text-slate-800'
                                }`}>
                                    {isSolutionView ? count : ''}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'sorting-classify-count'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<SortingClassifyCount payload={payload} />);
    }
};
