import React, {useEffect, useState} from 'react'
import {AuthOptions, AuthProvider, useAuth} from "./lib/auth";
import {CircularProgress, createMuiTheme, jssPreset, StylesProvider, ThemeProvider} from "@material-ui/core";
import {BrowserRouter as Router, Switch} from "react-router-dom";
import {HelmetProvider} from "react-helmet-async";
import {QueryClient, QueryClientProvider} from "react-query";
import {User} from "oidc-client";
import axios from "axios";
import {create as createJss} from 'jss'
import {routes} from './routes'

const authOptions: AuthOptions = {
    authority: 'https://devauth.thyteknik.com.tr',
    clientId: 'demoapp',
    scope: 'openid',
    redirectUri: 'http://localhost:3000/',
    async onUser(user: User | null): Promise<void> {
        if (user) {
            axios.defaults.headers['Authorization'] = `Bearer ${user?.access_token}`;
        } else {
            delete axios.defaults.headers['Authorization'];
        }
    }
};

const queryClient = new QueryClient()

const jss = createJss({
    plugins: [...jssPreset().plugins],
    insertionPoint: 'jss',
});
const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#ab47bc',
            light: '#df78ef',
            dark: '#790e8b',
            contrastText: '#fefefe',
        },
        secondary: {
            main: '#fdd835',
            light: '#ffff6b',
            dark: '#c6a700',
            contrastText: '#111',
        }
    },
    typography: {
        fontFamily: 'Inter'
    },
    overrides: {
        MuiButton: {
            root: {
                borderRadius: '10rem',
            },
            label: {
                paddingLeft: '1em',
                paddingRight: '1em',
                fontWeight: 600,
                letterSpacing: '0.025em'
            }
        }
    }
});

export default function App() {
    return (
        <HelmetProvider>
            <Router>
                {/* auth provider needs useHistory */}
                <AuthProvider options={authOptions}>
                    <QueryClientProvider client={queryClient}>
                        <StylesProvider jss={jss}>
                            <ThemeProvider theme={theme}>
                                <LoadingApp>
                                    <Switch>
                                        {/* attach key prop to stop react from complaining */}
                                        {routes.map((it, i) => React.cloneElement(it, {...it.props, key: i}))}
                                    </Switch>
                                </LoadingApp>
                            </ThemeProvider>
                        </StylesProvider>
                    </QueryClientProvider>
                </AuthProvider>
            </Router>
        </HelmetProvider>
    )
}


const LoadingApp: React.FC<{ timeout?: number; }> = (props) => {
    const {children, timeout = 400} = props;
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