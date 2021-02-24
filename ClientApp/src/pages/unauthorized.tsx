import React from "react";
import {useLocation} from "react-router-dom";
import {useAuth} from "../lib/auth";
import {Centered} from "../layout/layout";
import {Button} from "@material-ui/core";

export default function Unauthorized() {
    const location = useLocation();
    const {signIn} = useAuth();

    return (
        <Centered>
            <h1>you're unauthorized</h1>
            <Button onClick={() => signIn({next: location.state.next})}>click to sign in</Button>
        </Centered>
    )
}