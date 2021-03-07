import React from "react";
import {Helmet} from "react-helmet-async";

interface HeadProps {
    children: any;
}

export default function Head(props: HeadProps) {
    return <Helmet defaultTitle='blitz!!' titleTemplate={'%s · blitz'}>{props.children}</Helmet>
}