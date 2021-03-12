import axios from 'axios';
import decodeJwt from 'jwt-decode';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';

export interface JwtAuthOptions {
    tokenUrl: string;
    loginUrl: string;
    logoutUrl: string;
    onUser?(user): Promise<User>;
}

export interface User {
    sub: string;
    name: string;
    roles: string[];
    claims: { claimType: string; claimValue: string }[];
    accessToken: string;
    hasRole(...role: string[]): boolean;
    hasClaim(claimType: string, claimValue: string): boolean;
}

interface AuthContextValue {
    user: User | null;
    ready: boolean;
    login(state: any): Promise<void>;
    logout(): Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue>({} as any);
interface TokenResponse {
    accessToken: string;
}

interface Jwt {
    exp: number;
    sub: string;
    unique_name: string;
    role: string | string[];
    claims: any[];
    [claim: string]: any;
}

function makeArray(val: any): any[] {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
}

const getTokenRemainingSeconds = (jwt: Jwt): number => {
    const expiresAtSeconds = jwt.exp;
    const nowSeconds = Math.floor(+new Date() / 1000);
    const remainingLife = expiresAtSeconds - nowSeconds;
    return remainingLife;
};

const decodeToken = (token: string | null): Jwt | null => {
    if (!token) return null;

    const decoded = decodeJwt<Jwt>(token);
    const remainingLife = getTokenRemainingSeconds(decoded);

    if (remainingLife <= 60) {
        console.log('Token expired');
        return null;
    }

    console.info('Token will expire in', remainingLife, 'seconds');
    return decoded;
};

const STORAGE_PREFIX = 'login';
const saveLoginState = (state: any): string => {
    const key = Math.random().toString(36).substr(2, 10);
    localStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(state));
    return key;
};

const popLoginState = (key: string): any | null => {
    const storageKey = `${STORAGE_PREFIX}:${key}`;
    const value = JSON.parse(localStorage.getItem(storageKey) || 'null');
    localStorage.removeItem(storageKey);
    return value;
};

export const AuthProvider: React.FC<{ options: JwtAuthOptions }> = (props) => {
    const { options } = props;
    const [authUser, setUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);
    const history = useHistory();

    const getUser = async (force: boolean = false): Promise<User | null> => {
        let token = localStorage.getItem('token');
        let jwtClaims = decodeToken(token);
        if (!jwtClaims || force) {
            const res = await axios.post<TokenResponse>(options.tokenUrl, null, {
                withCredentials: true,
            });

            if (res?.status === 200) {
                token = res.data.accessToken;
                jwtClaims = decodeToken(res.data.accessToken)!;
            } else {
                console.log('User is not authenticated');
                setReady(true);
                return null;
            }
        }

        if (!jwtClaims) {
            return null;
        }

        localStorage.setItem('token', token!);

        let jwtUser: User = {
            ...jwtClaims,
            sub: jwtClaims.sub,
            name: jwtClaims.unique_name,
            roles: makeArray(jwtClaims.role),
            accessToken: token!,
            hasRole(...roles: string[]) {
                return roles.some((r) => this.roles.includes(r));
            },
            hasClaim(claimType, claimValue) {
                return this[claimType] === claimValue || this[claimType]?.includes(claimValue);
            },
        };

        return jwtUser;
    };

    const restoreState = () => {
        const url = new URL(window.location.href);
        const stateKey = url.searchParams.get('state');
        if (url.search) {
            url.search = '';
            window.history.replaceState(null, document.title, url.toString());
        }
        if (stateKey) {
            const state = popLoginState(stateKey);
            if (state?.next) {
                history.push({ pathname: state.next });
            } else if (!state) {
                console.warn('No matching login state found');
            }
        }
    };

    const refreshTokenIfNeeded = async () => {
        const jwt = decodeToken(localStorage.getItem('token'));
        if (!jwt) return;

        const remaining = getTokenRemainingSeconds(jwt);
        if (remaining > 120) {
            return;
        }

        console.log('Token is about to expire');
        let user = await getUser(true);
        if (user) {
            if (options.onUser) {
                user = await options.onUser(user);
            }
            setUser(user);
        }
    }

    useEffect(() => {
        const initAuth = async () => {
            let token = localStorage.getItem('token');
            let jwtClaims = decodeToken(token);
            let user = await getUser();
            if (user) {
                if (options.onUser) {
                    user = await options.onUser(user);
                }
                setUser(user);
            }

            restoreState();
            setReady(true);
        };

        initAuth();
    }, []);

    useEffect(() => {
        const id = setInterval(refreshTokenIfNeeded, 60 * 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user: authUser,
                ready,
                async login(state: any) {
                    const url = new URL(window.location.href);
                    if (state) {
                        const stateKey = saveLoginState(state);
                        url.searchParams.append('state', stateKey);
                    }
                    console.log('Redirecting to login page. Once logged in, will return to', url.toString());
                    const returnUrl = `${options.loginUrl}?returnUrl=${encodeURIComponent(url.toString())}`;
                    window.location.href = returnUrl;
                },
                async logout() {
                    localStorage.removeItem('token');
                    setUser(null);

                    const url = new URL(window.location.href);
                    url.pathname = '/';
                    url.search = '';
                    url.hash = '';
                    const returnUrl = `${options.logoutUrl}?returnUrl=${encodeURIComponent(url.toString())}`;
                    window.location.href = returnUrl;
                },
            }}
        >
            {props.children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
