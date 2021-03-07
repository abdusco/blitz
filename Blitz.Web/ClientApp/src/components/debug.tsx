import React from "react";

export function Debug({value}: { value: any }) {
    return <pre>{JSON.stringify(value, null, 2)}</pre>
}