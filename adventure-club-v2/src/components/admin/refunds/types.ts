export type RefundRegistration = {
  id: string;
  initialPaymentPaid: boolean;
  finalPaymentPaid: boolean;
  reimbursementAmount: number | null;
  user: {
    fullName: string;
    clubId: string;
    upiId?: string | null;
    upiPhone?: string | null;
  } | null;
  guestName: string | null;
};
