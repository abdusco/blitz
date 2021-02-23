import React from "react";
import {useCheckAuth} from "../lib/useCheckAuth";

export default function Users() {
    useCheckAuth()
    return <div>users</div>
}