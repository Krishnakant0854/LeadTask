export type SessionUser = {
  id: string;
  employeeId: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
  mobile: string | null;
  email: string | null;
  state: string | null;
  photoUrl: string | null;
};

export type CustomerRow = {
  id: string;
  customerName: string;
  mobile: string;
  product: string;
  date: string;
  employee?: {
    id: string;
    employeeId: string;
    name: string;
  };
  leadProcess: {
    status: "NEW_LEAD" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
    progress: number;
    income: number;
    rejectionReason: string | null;
  };
};

export type BankDetails = {
  holderName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
} | null;

export type WithdrawalRow = {
  id: string;
  amount: number;
  date: string;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
};
