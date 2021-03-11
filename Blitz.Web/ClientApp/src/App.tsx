import { ChakraProvider, CircularProgress, extendTheme, useToast } from '@chakra-ui/react';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter as Router, Switch, useHistory, useLocation } from 'react-router-dom';
import { CenteredFullScreen } from './layout/layout';
import { AuthProvider, JwtAuthOptions, useAuth } from './lib/auth';
import { routes } from './routes';

export default function App() {
    return (
        <HelmetProvider>
            <Router>
                {/* auth provider needs useHistory */}
                <AuthProvider options={authOptions}>
                    <QueryClientProvider client={queryClient}>
                        <ChakraProvider theme={theme} resetCSS={false}>
                            <FailedQueryNotifier>
                                <LoadingApp>
                                    <Switch>
                                        {/* attach key prop to stop react from complaining */}
                                        {routes.map((it, i) => React.cloneElement(it, { ...it.props, key: i }))}
                                    </Switch>
                                </LoadingApp>
                            </FailedQueryNotifier>
                        </ChakraProvider>
                    </QueryClientProvider>
                </AuthProvider>
            </Router>
        </HelmetProvider>
    );
}

const cancelToken = axios.CancelToken.source();
const baseUrl = process.env.NODE_ENV === 'production' ? location.origin : 'https://localhost:5001';
axios.defaults.baseURL = baseUrl + '/api';
axios.defaults.cancelToken = cancelToken.token;

const authOptions: JwtAuthOptions = {
    tokenUrl: baseUrl + '/api/auth/token',
    loginUrl: baseUrl + '/auth/login',
    logoutUrl: baseUrl + '/auth/logout',
    async onUser(user) {
        console.log('Current user', user);
        axios.defaults.headers['Authorization'] = `Bearer ${user.accessToken}`;
        return user;
    },
};

const FailedQueryNotifier: React.FC = (props) => {
    const toast = useToast();
    const history = useHistory();
    const prevRequestConfig = useRef<AxiosRequestConfig>();

    const sameRequest = (current: AxiosRequestConfig, prev: AxiosRequestConfig | undefined): boolean => {
        return current?.url === prev?.url;
    };
    
    useEffect(() => {
        history.listen((change) => {
            if (change.action == 'PUSH') {
                console.log('new path');
                cancelToken.cancel();
            }
        });
    }, []);

    useEffect(() => {
        axios.interceptors.response.use(
            (val) => val,
            (err: AxiosError) => {
                if (err.response?.status === 401) {
                    const atHome = history.location.pathname === '/';
                    if (atHome) {
                        return;
                    }

                    console.log('Now at', history.location.pathname, 'but is unauthenticated');
                    
                    // let user return back to where he was, unless he was already on unauthenticated page.
                    let next = history.location.state?.next || history.location.pathname;
                    history.push('/unauthenticated', { next });
                    return;
                }

                if ([400, 403].includes(err.response?.status!)) {
                    toast({
                        title: 'Oops',
                        status: 'error',
                        description: err.response?.data.detail || `That doesn't seem to be allowed.`,
                        duration: 3000,
                    });
                    return;
                }

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
    const { children, timeout = 400 } = props;
    const { ready, user } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const toast = useToast();
    const welcomeRef = useRef(false);
    const location = useLocation();
    const isReturning = !!location.state?.next;

    // welcome user
    useEffect(() => {
        if (welcomeRef.current) {
            return;
        }

        if (ready && user) {
            let greetings = `Welcome, ${user.name}`;
            if (isReturning) {
                greetings = `Welcome back, ${user.name}`;
            }
            toast({
                title: greetings,
                duration: 1500,
                status: 'info',
                position: 'top',
            });
            welcomeRef.current = true;
        }
    }, [user, ready]);

    useEffect(() => {
        let id = 0;
        if (ready) {
            id = setTimeout(() => setLoaded(true), timeout);
        }

        return () => clearTimeout(id);
    }, [ready, setLoaded]);

    if (!loaded) {
        return (
            <CenteredFullScreen>
                <CircularProgress isIndeterminate size={16} color="purple.500" />
            </CenteredFullScreen>
        );
    }

    return <>{children}</>;
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
                    borderRadius: '0.5em',
                },
                item: {
                    lineHeight: 1.5,
                    fontWeight: 500,
                    paddingTop: '0.5em',
                    paddingBottom: '0.5em',
                },
            },
        },
    },
});
