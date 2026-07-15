import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { CountingSimpleProblem, CountingIncDecProblem, CountingConservationProblem, CountingClassifyProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Scope, Area, Ability } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class CountingGenerator implements ProblemGenerator<CountingSimpleProblem | CountingIncDecProblem | CountingConservationProblem | CountingClassifyProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        
        let mode = constraints.mode;
        if (!mode) {
            if (labels.some(l => isSubConceptOf(l, Area.NumericIdentity))) {
                mode = 'conservation';
            } else if (labels.some(l => isSubConceptOf(l, Area.ObjectSorting))) {
                if (labels.some(l => isSubConceptOf(l, Ability.ConceptClassification))) {
                    mode = 'classify-count';
                } else {
                    mode = 'classify-sort';
                }
            } else if (constraints.countOut) {
                mode = 'count-out';
            } else if (labels.some(l => isSubConceptOf(l, Scope.AdditiveCount)) && labels.some(l => isSubConceptOf(l, Scope.PhysicalNumbers))) {
                mode = labels.some(l => isSubConceptOf(l, Ability.ProcedureUnderstanding)) ? 'cardinality' : 'one-to-one';
            } else {
                mode = 'simple';
            }
        }

        if (mode === 'conservation') {
            const resolvedRange = resolveRangeFromLabels(labels || []);
            const minCount = constraints.minCount !== undefined ? constraints.minCount : resolvedRange.min;
            const maxCount = constraints.maxCount !== undefined ? constraints.maxCount : resolvedRange.max;
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
        const resolvedRange = resolveRangeFromLabels(labels || []);
        let maxCount = constraints.maxCount || constraints.count || resolvedRange.max;
        let minCount = constraints.minCount || (constraints.count !== undefined ? constraints.count : resolvedRange.min);
        
        let incDecType = constraints.type; 
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

        const arrangement = constraints.arrangement || 'line';
        // Map arrangement to legacy layout property for backward compatibility
        const layout = arrangement === 'line' ? 'linear' : arrangement === 'scattered' ? 'scattered' : 'linear';

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
