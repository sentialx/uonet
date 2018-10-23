const { getUnixTime } = require('date-fns');

export const time = () => getUnixTime(new Date());
