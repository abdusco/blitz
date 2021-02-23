import React from "react";
import {Helmet} from "react-helmet-async";

export default function Head({children}) {
    return <Helmet>{children}</Helmet>
}