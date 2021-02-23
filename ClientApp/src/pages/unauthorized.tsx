import React from "react";
import {useLocation} from "react-router-dom";
import {useAuth} from "../lib/auth";

export default function Unauthorized() {
    const location = useLocation();
    const {signIn} = useAuth();

    return (
        <>
            <h1>you're unauthorized</h1>
            <button onClick={() => signIn({next: location.pathname})}>click to sign in</button>
        </>
    )
}