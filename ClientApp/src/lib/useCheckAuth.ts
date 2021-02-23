import {useEffect} from "react";
import {useAuth} from "./auth";
import {useHistory} from "react-router-dom";

export const useCheckAuth = () => {
    const {ready, user} = useAuth();
    const router = useHistory();
    useEffect(() => {
        if (ready && !user) {
            router.push({pathname: '/unauthorized'}, {next: router.location.pathname});
        }
    }, [ready, user])
}