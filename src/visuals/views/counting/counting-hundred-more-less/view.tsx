import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {CountingPlaceValueOffsetView} from '../counting-place-value-offset-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {
    CountingHundredMoreLessViewConfig,
    CountingHundredMoreLessViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: CountingHundredMoreLessViewConfig;
    payload: ViewRenderPayload<'counting-hundred-more-less'>;
}

const CountingHundredMoreLessCore = ({config: _config, payload}: CoreProps) => (
    <CountingPlaceValueOffsetView
        expectedStepSize={100}
        payload={payload}
        viewId="counting-hundred-more-less"
    />
);

export const CountingHundredMoreLess = withConfig(
    CountingHundredMoreLessViewSchema,
    CountingHundredMoreLessCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'counting-hundred-more-less'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<CountingHundredMoreLess payload={payload}/>);
    }
};
