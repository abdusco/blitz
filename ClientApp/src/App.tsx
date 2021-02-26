import React, {useEffect, useState} from 'react'
import {AuthOptions, AuthProvider, useAuth} from "./lib/auth";
import {BrowserRouter as Router, Switch} from "react-router-dom";
import {HelmetProvider} from "react-helmet-async";
import {QueryClient, QueryClientProvider} from "react-query";
import {Profile, User} from "oidc-client";
import axios, {AxiosError} from "axios";
import {routes} from './routes'
import {ChakraProvider, CircularProgress, extendTheme} from '@chakra-ui/react';

axios.defaults.baseURL = 'https://localhost:5001/api'

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
    },
    transformUserProfile(profile: Profile) {
        return {
            ...profile,
            firstName: profile.first_name,
            lastName: profile.surname,
        }
    }
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                return [401, 403].includes((error as AxiosError).response!.status) ? false : (failureCount < 2);
            },
        },
    },
})


const theme = extendTheme({
    brand: {
        900: "#1a365d",
        800: "#153e75",
        700: "#2a69ac",
    },
    fonts: {
        body: 'Inter',
        heading: 'Inter',
        mono: 'JetbrainsMono',
    },
    fontWeights: {
        bold: 600,
    },
    components: {
        Button: {
            baseStyle: {
                borderRadius: '2rem',
            }
        },
        CloseButton: {
            baseStyle: {
                borderRadius: '10rem'
            }
        },
    }
})

export default function App() {
    return (
        <HelmetProvider>
            <Router>
                {/* auth provider needs useHistory */}
                <AuthProvider options={authOptions}>
                    <QueryClientProvider client={queryClient}>
                        <ChakraProvider theme={theme} resetCSS={false}>
                            <LoadingApp>
                                <Switch>
                                    {/* attach key prop to stop react from complaining */}
                                    {routes.map((it, i) => React.cloneElement(it, {...it.props, key: i}))}
                                </Switch>
                            </LoadingApp>
                        </ChakraProvider>
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
            <CircularProgress isIndeterminate
                              color="green.300"/>
        </div>;
    }

    return <>{children}</>;
};