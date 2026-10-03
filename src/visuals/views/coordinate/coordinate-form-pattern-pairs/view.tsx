import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {CoordinatePatternView} from '../coordinate-pattern-view.tsx';
import type {CoordinateFormPatternPairsViewConfig} from './spec.ts';
import {CoordinateFormPatternPairsViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'coordinate-form-pattern-pairs';

interface CoreProps {
    config: CoordinateFormPatternPairsViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <CoordinatePatternView mode="form" payload={payload} viewId={VIEW_ID} />
);

export const CoordinateFormPatternPairs = withConfig(CoordinateFormPatternPairsViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<CoordinateFormPatternPairs payload={payload} />);
};
