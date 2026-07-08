export type RefundRegistration = {
  id: string;
  initialPaymentPaid: boolean;
  finalPaymentPaid: boolean;
  reimbursementAmount: number | null;
  reimbursementReceived: boolean;
  user: {
    fullName: string;
    clubId: string;
    upiId?: string | null;
    upiPhone?: string | null;
  } | null;
  guestName: string | null;
};

export type RefundTrekSettings = {
  expectedReimbursementMin: number | null;
  expectedReimbursementMax: number | null;
  reimbursementDone: boolean;
  reimbursementDoneAt: string | null;
};
