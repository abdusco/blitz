import React, {useEffect, useState} from 'react'
import {AuthOptions, AuthProvider, useAuth} from "./lib/auth";
import {CircularProgress} from "@material-ui/core";
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import Home from "./pages/home";
import Users from "./pages/users";
import Unauthorized from "./pages/unauthorized";
import {HelmetProvider} from "react-helmet-async";

const Routes = () => (<>
    <Route exact path='/' component={Home}/>
    <Route path='/users' component={Users}/>
    <Route path='/unauthorized' component={Unauthorized}/>
</>);

const authOptions: AuthOptions = {
    authority: 'https://devauth.thyteknik.com.tr',
    clientId: 'demoapp',
    scope: 'openid',
    redirectUri: 'http://localhost:3000/',
};

export default function App() {
    return (
        <HelmetProvider>
            <Router>
                {/* auth provider needs useHistory */}
                <AuthProvider options={authOptions}>
                    <LoadingApp>
                        <Switch>
                            <Routes/>
                        </Switch>
                    </LoadingApp>
                </AuthProvider>
            </Router>
        </HelmetProvider>
    )
}


const LoadingApp: React.FC<{ timeout?: number; }> = (props) => {
    const {children, timeout = 500} = props;
    const {ready} = useAuth();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let id = 0;
        if (ready) {
            id = setTimeout(() => setLoaded(true), timeout);
        }

        return () => clearTimeout(id);
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