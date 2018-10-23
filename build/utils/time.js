"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
exports.getTimestamp = () => date_fns_1.getUnixTime(new Date());
