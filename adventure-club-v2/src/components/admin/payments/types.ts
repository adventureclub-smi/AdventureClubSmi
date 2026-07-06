export type PaymentRecord = {
  id: string;
  type: "INITIAL" | "FINAL";
  amount: number;
  status: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
};

export type PaymentRegistration = {
  id: string;
  status: string;

  initialPaymentPaid: boolean;
  finalPaymentPaid: boolean;
  finalPaymentUnlocked: boolean;

  bondFormSubmitted: boolean;

  paymentAmount: number | null;
  paymentMethod: string | null;
  paymentPortal: boolean;
  offlinePaymentCreated: boolean;
  offlinePaymentVerified: boolean;

  user: {
    fullName: string;
    clubId: string;
    email?: string;
    upiId?: string | null;
    upiPhone?: string | null;
  } | null;

  guestName: string | null;

  payments?: PaymentRecord[];
};
