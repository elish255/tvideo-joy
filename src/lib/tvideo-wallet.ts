export type WithdrawalEntry = {
  id: string;
  amount: number;
  createdAt: string;
  status: "pending" | "completed";
};

export type TVideoWallet = {
  balance: number;
  profit: number;
  watched: number[];
  withdrawals: WithdrawalEntry[];
};

const WALLET_KEY = "tvideo-wallet-v2";
export const WALLET_UPDATE_EVENT = "tvideo-wallet-update";

export const emptyWallet: TVideoWallet = {
  balance: 0,
  profit: 0,
  watched: [],
  withdrawals: [],
};

const parseWallet = (raw: string | null): TVideoWallet => {
  if (!raw) return emptyWallet;
  try {
    const parsed = JSON.parse(raw) as Partial<TVideoWallet>;
    return {
      balance: Number(parsed.balance) || 0,
      profit: Number(parsed.profit) || 0,
      watched: Array.isArray(parsed.watched)
        ? parsed.watched.filter((id): id is number => typeof id === "number")
        : [],
      withdrawals: Array.isArray(parsed.withdrawals)
        ? parsed.withdrawals.filter(
            (entry): entry is WithdrawalEntry =>
              typeof entry === "object" &&
              entry !== null &&
              typeof entry.id === "string" &&
              typeof entry.amount === "number" &&
              typeof entry.createdAt === "string",
          )
        : [],
    };
  } catch {
    return emptyWallet;
  }
};

export const readWallet = (): TVideoWallet => {
  if (typeof window === "undefined") return emptyWallet;
  return parseWallet(window.localStorage.getItem(WALLET_KEY));
};

export const saveWallet = (wallet: TVideoWallet) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  window.dispatchEvent(new Event(WALLET_UPDATE_EVENT));
};

export const creditVideoReward = (videoId: number, reward: number) => {
  const wallet = readWallet();
  if (wallet.watched.includes(videoId)) {
    return { wallet, credited: false };
  }

  const nextWallet: TVideoWallet = {
    ...wallet,
    balance: wallet.balance + reward,
    profit: wallet.profit + reward,
    watched: [...wallet.watched, videoId],
  };
  saveWallet(nextWallet);
  return { wallet: nextWallet, credited: true };
};

export const requestWithdrawal = (amount: number) => {
  const wallet = readWallet();
  if (amount <= 0 || amount > wallet.balance) {
    return { wallet, ok: false };
  }

  const nextWallet: TVideoWallet = {
    ...wallet,
    balance: wallet.balance - amount,
    withdrawals: [
      {
        id: `WD-${Date.now().toString(36).toUpperCase()}`,
        amount,
        createdAt: new Date().toISOString(),
        status: "pending",
      },
      ...wallet.withdrawals,
    ],
  };
  saveWallet(nextWallet);
  return { wallet: nextWallet, ok: true };
};

export const formatMoney = (amount: number) => `TSh ${amount.toLocaleString("en-US")}`;
