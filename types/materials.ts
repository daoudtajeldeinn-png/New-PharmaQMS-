export type MaterialType = 'API' | 'Excipient' | 'Packaging' | 'Solvent';
export type MaterialStatus = 'Under_Test' | 'Approved' | 'Rejected' | 'Quarantine';
export type TestStatus = 'Pending' | 'Pass' | 'Fail' | 'OOS';
export type Pharmacopeia = 'BP' | 'USP' | 'EP';

export interface MaterialTest {
  id: string;
  name: string;
  spec: string;
  type: 'qualitative' | 'quantitative';
  method: string;
  result?: string | number;
  testedBy?: string;
  testedAt?: Date;
  status: TestStatus;
  remarks?: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  type: MaterialType;
  supplier: string;
  batchNumber: string;
  pharmacopeia: Pharmacopeia;
  quantity: number;
  unit: string;
  receivedDate: string;
  expiryDate: string;
  tests: MaterialTest[];
  status: MaterialStatus;
  createdAt: Date;
  location?: string;
}
