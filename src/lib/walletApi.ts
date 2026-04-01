const WALLET_API = 'https://casino-wallet-backend.onrender.com';

export interface WalletAddressEntry {
  address: string;
  network: string;
  label: string;
  symbol: string;
}

export interface WalletAddresses {
  BTC: WalletAddressEntry;
  ETH: WalletAddressEntry;
  BNB: WalletAddressEntry;
  LTC: WalletAddressEntry;
  TRX: WalletAddressEntry;
  MATIC: WalletAddressEntry;
  USDT_ERC20: WalletAddressEntry;
  USDT_BEP20: WalletAddressEntry;
  USDT_TRC20: WalletAddressEntry;
  USDT_POLYGON: WalletAddressEntry;
  USDC_ERC20: WalletAddressEntry;
  USDC_BEP20: WalletAddressEntry;
  USDC_POLYGON: WalletAddressEntry;
}

export type WalletAddressKey = keyof WalletAddresses;

export const registerWallet = async (userId: string, username: string): Promise<WalletAddresses> => {
  console.log('[WalletAPI] registerWallet called', { userId, username });
  const res = await fetch(`${WALLET_API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, username }),
  });
  const data = await res.json();
  console.log('[WalletAPI] registerWallet response', { status: res.status, data });
  if (!res.ok) throw new Error(`Wallet registration failed: ${JSON.stringify(data)}`);
  return data.addresses;
};

export const getAddresses = async (userId: string): Promise<WalletAddresses> => {
  console.log('[WalletAPI] getAddresses called', { userId });
  const res = await fetch(`${WALLET_API}/addresses?user_id=${userId}`);
  const data = await res.json();
  console.log('[WalletAPI] getAddresses response', { status: res.status, data });
  if (!res.ok) throw new Error(`Failed to fetch addresses: ${JSON.stringify(data)}`);
  return data;
};
