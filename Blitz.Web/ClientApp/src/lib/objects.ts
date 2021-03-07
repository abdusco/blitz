export function flattenObject(ob: Record<string, any>): Record<string, any> {
    const out = {};

    for (const i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if (typeof ob[i] == 'object' && ob[i] !== null) {
            const flatObject = flattenObject(ob[i]);
            for (const x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;

                out[i + '.' + x] = flatObject[x];
            }
        } else {
            out[i] = ob[i];
        }
    }
    return out;
}
