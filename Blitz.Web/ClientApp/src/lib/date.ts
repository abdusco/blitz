export const formatDateISO = (date: string): string => {
    // suffix date with "Z" to signify UTC offset
    // 2021-07-13T09:51:15.719613 -> 2021-07-13T09:51:15.719613Z == 2021-07-13T12:51:15.719613+03:00
    const parsed = new Date(date + 'Z');
    const isoDate = parsed.toLocaleDateString('en-CA'); // like 2021-12-13
    const isoTime = parsed.toLocaleTimeString('tr-TR'); // like 13:12:11
    return `${isoDate} ${isoTime}`;
};
