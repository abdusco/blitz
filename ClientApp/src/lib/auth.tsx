import React, { useEffect, useState } from 'react';
import oidc, { Profile, User, UserManager, UserManagerSettings, WebStorageStateStore } from 'oidc-client';
import { useHistory } from 'react-router-dom';

oidc.Log.logger = console;

// oidc.Log.level = oidc.Log.DEBUG;

export interface AuthOptions
    extends Omit<UserManagerSettings, 'authority' | 'client_id' | 'client_secret' | 'redirect_uri' | 'scope'> {
    autoSignIn?: boolean;
    authority: string;
    clientId: string;
    scope: string;
    redirectUri?: string;

    onUser: (user: User | null) => Promise<void>;
    transformUserProfile?: (profile: Profile) => Profile;

    [oidcOptsKey: string]: any;
}

export interface AuthContextProps {
    user: User | null;
    ready: boolean;
    signIn: (state?: unknown) => Promise<void>;
    signOut: () => Promise<void>;
    signOutRedirect: (args?: unknown) => Promise<void>;
}

const hasCodeInUrl = (location: Location): boolean => {
    const searchParams = new URLSearchParams(location.search);
    return ['code', 'state'].every((key) => searchParams.has(key));
};

const clearAuthQuery = () => {
    const url = new URL(window.location.href);
    url.search = '';
    history.replaceState(null, document.title, url.toString());
};

export const initUserManager = (options: AuthOptions): UserManager => {
    return new UserManager({
        authority: options.authority,
        client_id: options.clientId,
        redirect_uri: options.redirectUri,
        post_logout_redirect_uri: options.redirectUri,
        response_type: options.responseType || 'code',
        response_mode: 'query',
        scope: options.scope || 'openid',
        loadUserInfo: false,
        automaticSilentRenew: options.automaticSilentRenew,
        monitorSession: false,
        stateStore: new WebStorageStateStore({ store: localStorage }),
        userStore: new WebStorageStateStore({ store: localStorage }),
    });
};

const noop = (params: any) => Promise.resolve();

const AuthContext = React.createContext<AuthContextProps>({} as any);
export const AuthProvider: React.FC<{ options: AuthOptions }> = (props) => {
    const history = useHistory();
    const { children, options } = props;
    const { onUser = noop, transformUserProfile } = options;
    const [userState, setUserState] = useState<User | null>(null);
    const [ready, setReady] = useState(false);

    const userManager = initUserManager(options);

    const signOutHooks = async (): Promise<void> => {
        setUserState(null);
    };

    useEffect(() => {
        const getUser = async () => {
            if (hasCodeInUrl(location)) {
                const user = await userManager.signinCallback();
                await onUser(user);
                if (transformUserProfile) {
                    user.profile = transformUserProfile(user.profile);
                }
                setUserState(user);
                clearAuthQuery();

                if (user.state?.next) {
                    history.push(user.state?.next);
                }
            } else {
                const user = await userManager!.getUser();
                if (user && !user.expired) {
                    await onUser(user);
                    if (transformUserProfile) {
                        user.profile = transformUserProfile(user.profile);
                    }
                    setUserState(user);
                } else if (options.autoSignIn) {
                    await userManager.signinRedirect();
                }
            }
        };
        const updateUserData = async () => {
            const user = await userManager.getUser();
            await onUser(user);
            if (user && transformUserProfile) {
                user.profile = transformUserProfile(user.profile);
            }
            setUserState(user);
            setReady(true);
        };

        getUser().then(() => setReady(true));

        userManager.events.addUserLoaded(updateUserData);
        return () => userManager.events.removeUserLoaded(updateUserData);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user: userState,
                ready,
                signIn: async (state: unknown): Promise<void> => {
                    await userManager.removeUser();
                    await userManager.clearStaleState();
                    await userManager.signinRedirect({ state });
                },
                signOut: async (): Promise<void> => {
                    await userManager.removeUser();
                    await signOutHooks();
                },
                signOutRedirect: async (args?: unknown): Promise<void> => {
                    await userManager.signoutRedirect(args);
                    await signOutHooks();
                },
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
export const useAuth = () => React.useContext(AuthContext);

export function useToken(): string | null {
    const { user } = useAuth();
    if (!user) {
        return null;
    }

    return user!.access_token;
}

export function useUserProfile(): Profile | null {
    const auth = useAuth();
    if (!auth.user) {
        return null;
    }

    return auth.user?.profile;
}
