import {useAuth} from "../lib/auth";
import {Link, useLocation} from "react-router-dom";
import React from "react";

export default function Nav() {
    const auth = useAuth();
    const location = useLocation();
    return <nav>
        <Link to='/'>home</Link>
        <Link to='/users'>users</Link>
        {!auth.user && <button onClick={() => auth.signIn(location.pathname)}>login</button>}
        {auth.user && <button onClick={() => auth.signOut()}>logout</button>}
    </nav>;
}

