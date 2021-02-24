import {Route} from "react-router-dom";
import Home from "./pages/home";
import Users from "./pages/users";
import Unauthorized from "./pages/unauthorized";
import React from "react";
import Cronjobs from "./pages/cronjobs";
import Projects from "./pages/projects";
import Executions from "./pages/executions";

export const routes = [
    <Route exact path='/' component={Home}/>,
    <Route path='/users' component={Users}/>,
    <Route path='/unauthorized' component={Unauthorized}/>,
    <Route path='/users' component={Users}/>,
    <Route path='/cronjobs' component={Cronjobs}/>,
    <Route path='/projects' component={Projects}/>,
    <Route path='/executions' component={Executions}/>,
]