import {Scope} from 'edugraph-ts';
import {useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {generateScatteredPositions} from './helpers.ts';
import { SortingClassifySortViewConfig, SortingClassifySortViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData } from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

interface Item {
    shape: string;
    color: string;
}

const COLOR_MAP: Record<string, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#14b8a6'
};

interface CoreProps {
    config: SortingClassifySortViewConfig;
    payload: ViewRenderPayload<'sorting-classify-sort'>;
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

const SortingClassifySortCore = ({ payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    validateProblemData('sorting-classify-sort', data, ['items', 'categories', 'relation', 'answer']);

    const relation = data.relation;

    const { items, categories, classifyType, mappedCategories } = useMemo(() => {
        const itemsList = data.items;
        const categoriesMap = data.categories;

        // View logic: Randomly decide how to represent the abstract groups visually
        let seed = payload.seed ?? 42;
        const nextRand = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        const chosenClassifyType = payload.labels.includes(Scope.ShapeProperties) ? 'shape' : (nextRand() > 0.5 ? 'shape' : 'color');
        
        const shapes = ['circle', 'square', 'triangle'];
        const colors = ['red', 'blue', 'green'];
        
        // Map abstract categories (A, B, C) to the primary sorting trait
        const activeTraits = chosenClassifyType === 'shape' ? shapes : colors;
        const mappedCategories: Record<string, string> = {};
        Object.keys(categoriesMap).forEach((cat, index) => {
            mappedCategories[cat] = activeTraits[index % activeTraits.length];
        });

        // Map items to physical objects
        const physicalItems = itemsList.map(cat => {
            const primaryTrait = mappedCategories[cat as unknown as string];
            const secondaryTraits = chosenClassifyType === 'shape' ? colors : shapes;
            const secondaryTrait = secondaryTraits[Math.floor(nextRand() * secondaryTraits.length)];
            
            if (chosenClassifyType === 'shape') {
                return { shape: primaryTrait, color: secondaryTrait };
            } else {
                return { shape: secondaryTrait, color: primaryTrait };
            }
        });

        return { 
            items: physicalItems, 
            categories: categoriesMap, 
            classifyType: chosenClassifyType,
            mappedCategories 
        };
    }, [data.items, data.categories, payload.seed, payload.labels]);

    const { positions, itemSize } = useMemo(() => {
        return generateScatteredPositions(items.length, 450, 200, 32);
    }, [items.length]);

    const resolvedAnswer = useMemo(() => {
        return mappedCategories[data.answer];
    }, [data.answer, mappedCategories]);

    const promptText = `Which ${classifyType} has the ${relation} number of items?`;

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.4rem] font-bold text-slate-700 mb-5 text-center leading-relaxed">
                    {promptText}
                </div>
                
                <div className="relative w-[450px] h-[200px] bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden mb-[25px]">
                    {positions.map((pos, i) => (
                        <div 
                            key={i}
                            className="absolute flex justify-center items-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                            style={{ left: `${pos.x}px`, top: `${pos.y}px`, width: `${itemSize}px`, height: `${itemSize}px` }}
                        >
                            <ItemSVG item={items[i]} size={itemSize} />
                        </div>
                    ))}
                </div>

                <div className="w-full flex gap-3">
                    {Object.keys(categories).sort().map(cat => {
                        const trait = mappedCategories[cat];
                        const labelText = trait.charAt(0).toUpperCase() + trait.slice(1);
                        const isCorrect = trait === resolvedAnswer;
                        
                        const catItem = classifyType === 'shape' 
                            ? { shape: trait, color: 'blue' } 
                            : { shape: 'circle', color: trait };

                        return (
                            <div 
                                key={cat}
                                className={`flex-1 py-3 px-2.5 border-2 rounded-lg flex flex-col items-center gap-2 font-semibold text-[0.95rem] transition-all duration-200 ${
                                    (isCorrect && isSolutionView === true)
                                        ? 'border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold'
                                        : 'border-slate-200 bg-white text-slate-600'
                                }`}
                            >
                                <ItemSVG item={catItem} size={32} />
                                <span>{labelText}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const SortingClassifySort = withConfig(SortingClassifySortViewSchema, SortingClassifySortCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'sorting-classify-sort'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<SortingClassifySort payload={payload} />);
    }
};
