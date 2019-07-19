import select from 'select-dom';
import 'webext-dynamic-content-scripts';

// Add all features here
import './features/feature-template';
import './features/source-icons';
import './features/pr-linked-jira-summary';
import './features/pr-linkify-header-branches';
import './features/project-resizable-nav';

// Add global for easier debugging
(window as any).select = select;
