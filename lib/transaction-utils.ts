export function getTransactionSummary(transactions: any[]) {
  const totalTransactions = transactions.length;
  const borrowTransactions = transactions.filter((t) => t.type === "borrow").length;
  const returnTransactions = transactions.filter((t) => t.type === "return").length;
  const completedTransactions = transactions.filter((t) => t.status === "completed").length;
  const overdueTransactions = transactions.filter((t) => t.dueDate && new Date() > t.dueDate && t.status !== "completed").length;
  const totalDeposits = transactions.filter((t) => t.type === "borrow").reduce((sum, t) => sum + (t.depositAmount || 0), 0);
  const totalRefunds = transactions.filter((t) => t.type === "return").reduce((sum, t) => sum + (t.depositAmount || 0), 0);
  const totalLateFees = transactions.reduce((sum, t) => sum + (t.lateFee || 0), 0);
  return {
    totalTransactions,
    borrowTransactions,
    returnTransactions,
    completedTransactions,
    overdueTransactions,
    totalDeposits,
    totalRefunds,
    totalLateFees,
    completionRate: totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0,
    returnRate: borrowTransactions > 0 ? (returnTransactions / borrowTransactions) * 100 : 0,
  };
}


export interface TransactionCalculation {
  depositAmount: number;
  lateFee: number;
  totalAmount: number;
  dueDate: Date;
  isOverdue: boolean;
  hoursOverdue: number;
}

export function calculateTransactionFees(
  transaction: { depositAmount: number; dueDate?: Date },
  policy: { lateFeePerHour: number },
  currentDate: Date = new Date(),
): TransactionCalculation {
  const depositAmount = transaction.depositAmount;
  let lateFee = 0;
  let isOverdue = false;
  let hoursOverdue = 0;

  if (transaction.dueDate && currentDate > transaction.dueDate) {
    isOverdue = true;
    const overdueMs = currentDate.getTime() - transaction.dueDate.getTime();
    hoursOverdue = Math.ceil(overdueMs / (1000 * 60 * 60));
    lateFee = hoursOverdue * policy.lateFeePerHour;
  }

  const totalAmount = depositAmount + lateFee;

  return { depositAmount, lateFee, totalAmount, dueDate: transaction.dueDate || new Date(), isOverdue, hoursOverdue };
}


