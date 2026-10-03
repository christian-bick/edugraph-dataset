import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {CoordinatePatternView} from '../coordinate-pattern-view.tsx';
import type {CoordinatePlotPatternPairsViewConfig} from './spec.ts';
import {CoordinatePlotPatternPairsViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-plot-pattern-pairs';

interface CoreProps {
    config: CoordinatePlotPatternPairsViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <CoordinatePatternView mode="plot" payload={payload} viewId={VIEW_ID} />
);

export const CoordinatePlotPatternPairs = withConfig(CoordinatePlotPatternPairsViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinatePlotPatternPairs payload={payload} />);
};
