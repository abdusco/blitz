import React, { useEffect, useRef, useState } from 'react';
import { AuthOptions, AuthProvider, useAuth } from './lib/auth';
import { BrowserRouter as Router, Switch } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Profile, User } from 'oidc-client';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { routes } from './routes';
import { ChakraProvider, CircularProgress, extendTheme, useToast } from '@chakra-ui/react';

export default function App() {
    return (
        <HelmetProvider>
            <Router>
                {/* auth provider needs useHistory */}
                <AuthProvider options={authOptions}>
                    <QueryClientProvider client={queryClient}>
                        <ChakraProvider theme={theme} resetCSS={false}>
                            <LoadingApp>
                                <FailedQueryNotifier>
                                    <Switch>
                                        {/* attach key prop to stop react from complaining */}
                                        {routes.map((it, i) => React.cloneElement(it, { ...it.props, key: i }))}
                                    </Switch>
                                </FailedQueryNotifier>
                            </LoadingApp>
                        </ChakraProvider>
                    </QueryClientProvider>
                </AuthProvider>
            </Router>
        </HelmetProvider>
    );
}

const FailedQueryNotifier: React.FC = (props) => {
    const toast = useToast();
    const prevRequestConfig = useRef<AxiosRequestConfig>();

    const sameRequest = (current: AxiosRequestConfig, prev: AxiosRequestConfig | undefined): boolean => {
        return current?.url === prev?.url;
    };

    useEffect(() => {
        axios.interceptors.response.use(
            (val) => val,
            (err: AxiosError) => {
                if (sameRequest(err.config, prevRequestConfig.current)) {
                    return;
                }
                
                prevRequestConfig.current = err.config;

                const isNetworkError = err?.message === 'Network Error';
                const statusCode = err?.response?.status;

                const title = isNetworkError
                    ? 'Network error'
                    : statusCode
                    ? `Request failed with ${statusCode}`
                    : 'Request failed';
                toast({
                    title: title,
                    status: 'error',
                    duration: 2000,
                    description: (
                        <div>
                            Failed to fetch <code>{err.config.url}.</code>
                            {isNetworkError && (
                                <>
                                    <br />
                                    Make sure you're online and the API can receive requests
                                </>
                            )}
                        </div>
                    ),
                });
            }
        );
    }, []);
    return <>{props.children}</>;
};

const LoadingApp: React.FC<{ timeout?: number }> = (props) => {
    const { children, timeout = 500 } = props;
    const { ready } = useAuth();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let id = 0;
        if (ready) {
            id = setTimeout(() => setLoaded(true), timeout);
        }

        return () => clearTimeout(id);
    }, [ready, setLoaded]);

    if (!loaded) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <CircularProgress isIndeterminate size={20} color="purple.500" />
            </div>
        );
    }

    return <>{children}</>;
};

axios.defaults.baseURL = 'https://localhost:5001/api';

const authOptions: AuthOptions = {
    authority: 'https://localhost:5001',
    clientId: 'demoapp',
    scope: 'openid profile',
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
            name: profile.name || `${profile.first_name} ${profile.surname}`,
        };
    },
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                return [401, 403].includes((error as AxiosError)?.response?.status as any) ? false : failureCount < 1;
            },
        },
    },
});

const theme = extendTheme({
    brand: {
        900: '#1a365d',
        800: '#153e75',
        700: '#2a69ac',
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
            },
        },
        CloseButton: {
            baseStyle: {
                borderRadius: '10rem',
            },
        },
        Menu: {
            baseStyle: {
                list: {
                    paddingTop: 0,
                    paddingBottom: 0,
                    boxShadow: '0 0.25rem 1rem -0.25rem rgba(0,0,0,0.2)',
                },
                item: {
                    fontWeight: 500,
                },
            },
        },
    },
});
