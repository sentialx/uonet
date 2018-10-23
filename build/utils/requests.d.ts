import { RequestBaseData, Certificate } from '../models';
export declare const getRestApiURL: (code: string) => Promise<any>;
export declare const getRequest: (data: RequestBaseData, certificate?: Certificate) => Promise<{
    data: any;
    headers: any;
    url: string;
    method: string;
}>;
