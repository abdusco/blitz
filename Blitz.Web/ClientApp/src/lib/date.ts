export const formatDateISO = (date: string): string => {
    const parsed = new Date(date);
    const isoDate = parsed.toLocaleDateString('en-CA'); // like 2021-12-13
    const isoTime = parsed.toLocaleTimeString('tr-TR'); // like 13:12:11
    return `${isoDate} ${isoTime}`;
};
