import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { random } from "../../lib/random.ts";

export class CountingGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'counting';
    compatibleRenderers = ['counting-objects', 'counting-inc-dec', 'counting-conservation', 'sorting-classify'];

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        const mode = constraints.mode || 'simple';

        if (mode === 'conservation') {
            const minCount = constraints.minCount || 5;
            const maxCount = constraints.maxCount || 12;
            const count = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
            return {
                id: `conservation-${count}`,
                data: {
                    mode: 'conservation',
                    numObjects: count
                }
            };
        }

        if (mode === 'classify-count' || mode === 'classify-sort') {
            const minTotal = constraints.minTotal || 5;
            const maxTotal = constraints.maxTotal || 10;
            const total = Math.floor(random() * (maxTotal - minTotal + 1)) + minTotal;

            const shapes = ['circle', 'square', 'triangle'];
            const colors = ['red', 'blue', 'green'];
            const classifyType = constraints.classifyType || (random() > 0.5 ? 'shape' : 'color');

            const items: { shape: string; color: string }[] = [];
            const counts: Record<string, number> = {};

            for (let i = 0; i < total; i++) {
                const shape = shapes[Math.floor(random() * shapes.length)];
                const color = colors[Math.floor(random() * colors.length)];
                items.push({ shape, color });

                const key = classifyType === 'shape' ? shape : color;
                counts[key] = (counts[key] || 0) + 1;
            }

            // Ensure categories list is complete with 0 for missing ones
            const possibleCategories = classifyType === 'shape' ? shapes : colors;
            possibleCategories.forEach(cat => {
                if (counts[cat] === undefined) counts[cat] = 0;
            });

            if (mode === 'classify-count') {
                return {
                    id: `classify-count-${classifyType}-${total}-${Math.floor(random() * 1000)}`,
                    data: {
                        mode: 'classify-count',
                        classifyType,
                        items,
                        categories: counts,
                        numObjects: total
                    }
                };
            } else {
                const relation = constraints.relation || (random() > 0.5 ? 'most' : 'least');
                
                // Find category with most/least
                let targetCategory = '';
                let targetCount = relation === 'most' ? -1 : 999;
                
                // For 'least', we only consider categories that have at least 1 item to make it interesting, or any category.
                // Let's support any category.
                possibleCategories.forEach(cat => {
                    const c = counts[cat];
                    if (relation === 'most') {
                        if (c > targetCount) {
                            targetCount = c;
                            targetCategory = cat;
                        }
                    } else {
                        if (c < targetCount) {
                            targetCount = c;
                            targetCategory = cat;
                        }
                    }
                });

                // Check for ties, if tie let's return null to retry so we have a unique answer
                const hasTie = possibleCategories.some(cat => cat !== targetCategory && counts[cat] === targetCount);
                if (hasTie) {
                    return null;
                }

                return {
                    id: `classify-sort-${classifyType}-${relation}-${total}-${Math.floor(random() * 1000)}`,
                    data: {
                        mode: 'classify-sort',
                        classifyType,
                        items,
                        categories: counts,
                        relation,
                        answer: targetCategory,
                        numObjects: total
                    }
                };
            }
        }

        // For how-many, one-to-one, count-out, simple/inc-dec
        let maxCount = constraints.maxCount || constraints.count;
        if (!maxCount) {
            if (labels.includes('Scope.NumbersSmaller20')) maxCount = 20;
            else if (labels.includes('Scope.NumbersSmaller10')) maxCount = 10;
            else maxCount = 10;
        }

        let incDecType = constraints.type; 
        const minCount = constraints.minCount || Math.max(1, maxCount - 9); 
        const numObjects = constraints.count !== undefined ? constraints.count : Math.floor(random() * (maxCount - minCount + 1)) + minCount;
        
        if (incDecType === 'dec' && numObjects <= 1) {
            return null;
        }

        let incDecAnswer = undefined;
        if (incDecType === 'inc') incDecAnswer = numObjects + 1;
        if (incDecType === 'dec') incDecAnswer = numObjects - 1;

        if (mode === 'count-out') {
            const totalCount = constraints.totalCount || Math.max(numObjects, Math.floor(random() * (20 - numObjects + 1)) + numObjects);
            return {
                id: `count-out-${numObjects}-${totalCount}`,
                data: {
                    mode: 'count-out',
                    numObjects,
                    totalCount,
                    simpleAnswer: numObjects
                }
            };
        }

        const layout = constraints.layout || 'linear';
        const arrangement = constraints.arrangement || 'line';

        return {
            id: `${mode}-${numObjects}-${incDecType || 'simple'}-${layout}-${arrangement}`,
            data: {
                mode,
                numObjects: numObjects,
                incDecType: incDecType,
                incDecAnswer: incDecAnswer,
                simpleAnswer: numObjects,
                layout,
                arrangement
            }
        };
    }
}
