import React, {ReactNode, useEffect, useState} from 'react'
import './App.css'
import {AuthProvider, useAuth} from "./lib/auth";
import {CircularProgress} from "@material-ui/core";
import {BrowserRouter as Router, Route, Switch, useHistory} from "react-router-dom";
import Home from "./pages/home";
import Users from "./pages/users";
import Unauthorized from "./pages/unauthorized";

function Shell(props: { children: ReactNode }) {
    const history = useHistory();
    return <AuthProvider options={{
        authority: 'https://devauth.thyteknik.com.tr',
        clientId: 'demoapp',
        scope: 'openid',
        redirectUri: 'http://localhost:3000/',
        onAuthCallback(next) {
            history.push({pathname: next});
        }
        // autoSignIn: true,
    }}>
        <LoadingApp>
            {props.children}
        </LoadingApp>
    </AuthProvider>;
}

export default function App() {
    return (
        <Router>
            <Shell>
                <Switch>
                    <Route exact path='/' component={Home}/>
                    <Route path='/users' component={Users}/>
                    <Route path='/unauthorized' component={Unauthorized}/>
                </Switch>
            </Shell>
        </Router>
    )
}


const LoadingApp: React.FC<{ timeout?: number; }> = (props) => {
    const {children, timeout = 500} = props;
    const {ready} = useAuth();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (ready) {
            setTimeout(() => setLoaded(true), timeout);
        }
    }, [ready, setLoaded]);

    if (!loaded) {
        return <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <CircularProgress size={40}/>
        </div>;
    }

    return <>{children}</>;
};