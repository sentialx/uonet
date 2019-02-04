import { Account, Lesson } from './models';
export declare class UONET {
    accounts: Account[];
    request(accountId: number, body: any, method: string): Promise<any>;
    getTimetable(accountId: number, from: string, to: string): Promise<Lesson[]>;
    login(pin: string, token: string, symbol: string): Promise<void>;
}
