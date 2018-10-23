import { Certificate } from '.';

export interface Account {
  id: number;
  branchId: number;
  periodId: number;
  baseURL: string;
  certificate: Certificate;
}
