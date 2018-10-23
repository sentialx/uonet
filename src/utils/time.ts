import { getUnixTime } from 'date-fns';

export const getTimestamp = () => getUnixTime(new Date());
