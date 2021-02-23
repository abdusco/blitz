import React from "react";
import Nav from "../components/nav";

export default function DefaultLayout(props) {
    return (<>
        <Nav/>
        {props.children}
    </>)
}