import { Route } from 'react-router-dom';
import Home from './pages/home';
import Users from './pages/users';
import Unauthorized from './pages/unauthorized';
import React from 'react';
import Cronjobs from './pages/cronjobs';
import Projects from './pages/projects';
import Executions from './pages/executions';
import Project from './pages/project';
import Cronjob from './pages/cronjob';
import Execution from './pages/execution';

export const routes = [
    <Route exact path="/" component={Home} />,
    <Route path="/users" component={Users} />,
    <Route path="/unauthorized" component={Unauthorized} />,
    <Route path="/cronjobs/:id" component={Cronjob} />,
    <Route path="/cronjobs" component={Cronjobs} />,
    <Route path="/projects/:id" component={Project} />,
    <Route path="/projects" component={Projects} />,
    <Route path="/executions/:id" component={Execution} />,
    <Route path="/executions" component={Executions} />,
];
