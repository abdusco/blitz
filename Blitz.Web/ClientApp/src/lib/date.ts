import dayjs from 'dayjs';

export const formatDateISO = (date: string): string => {
    return dayjs(date, { utc: true }).local().format('YYYY-MM-DD HH:mm:ss');
};
