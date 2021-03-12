import { CircularProgress } from '@chakra-ui/react';
import React, { PropsWithChildren, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { CenteredFullScreen } from './layout/layout';
import Execution from './pages/execution';
import Executions from './pages/executions';
import Home from './pages/home';

const spinner = (
    <CenteredFullScreen>
        <CircularProgress isIndeterminate size={16} color="purple.500" />
    </CenteredFullScreen>
);
const lazyComponent = (promise: () => Promise<{ default: any }>) => {
    const Lazy = React.lazy(promise);

    return (props: PropsWithChildren<any>) => (
        <Suspense fallback={spinner}>
            <Lazy />
        </Suspense>
    );
};

const Users = lazyComponent(() => import('./pages/users'));
const Unauthenticated = lazyComponent(() => import('./pages/unauthenticated'));
const Forbidden = lazyComponent(() => import('./pages/forbidden'));
const Projects = lazyComponent(() => import('./pages/projects'));
const Project = lazyComponent(() => import('./pages/project'));
const Cronjobs = lazyComponent(() => import('./pages/cronjobs'));
const Cronjob = lazyComponent(() => import('./pages/cronjob'));

export const routes = [
    <Route exact path="/" component={Home} />,
    <Route path="/users" component={Users} />,
    <Route path="/unauthenticated" component={Unauthenticated} />,
    <Route path="/forbidden" component={Forbidden} />,
    <Route path="/cronjobs/:id" component={Cronjob} />,
    <Route path="/cronjobs" component={Cronjobs} />,
    <Route path="/projects/:id" component={Project} />,
    <Route path="/projects" component={Projects} />,
    <Route path="/executions/:id" component={Execution} />,
    <Route path="/executions" component={Executions} />,
];
