import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import decodeJwt from 'jwt-decode';
import { useHistory } from 'react-router';

export interface JwtAuthOptions {
    tokenUrl: string;
    loginUrl: string;
    logoutUrl: string;
    onUser?(user: User, claims: Jwt): Promise<User>;
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
    role: string[];
    claims: any[];
    [claim: string]: any;
}

const decodeToken = (token: string | null): Jwt | null => {
    if (!token) return null;

    const decoded = decodeJwt<Jwt>(token);
    const expiresAtSeconds = decoded.exp;
    const nowSeconds = Math.floor(+new Date() / 1000);
    const remainingLife = expiresAtSeconds - nowSeconds;

    if (remainingLife <= 60) {
        console.log('Token expired');
        return null;
    }

    console.info('Token will expire in', remainingLife, 'seconds');
    return decoded;
};

export const AuthProvider: React.FC<{ options: JwtAuthOptions }> = (props) => {
    const { options } = props;
    const [user, setUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);
    const history = useHistory();

    useEffect(() => {
        const getUser = async () => {
            let token = localStorage.getItem('token');
            let jwtClaims = decodeToken(token);
            if (!jwtClaims) {
                const res = await axios.post<TokenResponse>(options.tokenUrl, null, {
                    withCredentials: true,
                });

                if (res?.status === 200) {
                    token = res.data.accessToken;
                    jwtClaims = decodeToken(res.data.accessToken)!;
                } else {
                    console.log('User is not authenticated');
                    setReady(true);
                    return;
                }
            }

            if (jwtClaims) {
                localStorage.setItem('token', token!);

                let jwtUser: User = {
                    ...jwtClaims,
                    sub: jwtClaims.sub,
                    name: jwtClaims.unique_name,
                    claims: jwtClaims.claims || [],
                    roles: jwtClaims.role || [],
                    accessToken: token!,
                    hasRole(...roles: string[]) {
                        return roles.some((r) => this.roles.includes(r));
                    },
                    hasClaim(claimType, claimValue) {
                        return (
                            this[claimType] === claimValue ||
                            this.claims.some((c) => c?.claimType === claimType && c?.claimValue === claimValue)
                        );
                    },
                };

                if (options.onUser) {
                    jwtUser = await options.onUser(jwtUser, jwtClaims);
                }

                const url = new URL(window.location.href);
                const stateJson = url.searchParams.get('state') || '{}';
                const state = JSON.parse(stateJson);
                window.history.replaceState(null, document.title, url.toString());

                setUser(jwtUser);
                if (state.next) {
                    history.push({ pathname: state.next });
                }
                setReady(true);
            }
        };

        getUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                ready,
                async login(state: any) {
                    const url = new URL(window.location.href);
                    if (state) {
                        url.searchParams.append('state', JSON.stringify(state));
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
