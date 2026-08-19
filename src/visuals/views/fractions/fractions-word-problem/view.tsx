import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {FractionArithmeticView} from '../fraction-arithmetic-view.tsx';
import {
    FractionsWordProblemViewConfig,
    FractionsWordProblemViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-word-problem';

interface CoreProps {
    config: FractionsWordProblemViewConfig;
    payload: ViewRenderPayload<'fractions-word-problem'>;
}

const FractionsWordProblemCore = ({payload}: CoreProps) => (
    <FractionArithmeticView
        layout="word"
        payload={payload}
        presentation="execution-word"
        viewId={VIEW_ID}
    />
);

export const FractionsWordProblem = withConfig(
    FractionsWordProblemViewSchema,
    FractionsWordProblemCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'fractions-word-problem'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsWordProblem payload={payload} />);
    }
};
