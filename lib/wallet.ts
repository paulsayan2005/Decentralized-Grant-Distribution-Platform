// Dynamic imports to prevent StellarWalletsKit from injecting CSS variables
// onto <html> during SSR, which causes a hydration mismatch.

let kitClass: any = null;
let isInitialized = false;

export async function getStellarWalletsKit() {
  if (typeof window === "undefined") {
    throw new Error("StellarWalletsKit can only be initialized on the client side");
  }

  if (!isInitialized) {
    const { StellarWalletsKit, Networks } = await import("@creit.tech/stellar-wallets-kit");
    const { FreighterModule } = await import("@creit.tech/stellar-wallets-kit/modules/freighter");
    const { xBullModule } = await import("@creit.tech/stellar-wallets-kit/modules/xbull");
    const { AlbedoModule } = await import("@creit.tech/stellar-wallets-kit/modules/albedo");
    const { LobstrModule } = await import("@creit.tech/stellar-wallets-kit/modules/lobstr");
    const { HanaModule } = await import("@creit.tech/stellar-wallets-kit/modules/hana");

    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules: [
        new FreighterModule(),
        new xBullModule(),
        new AlbedoModule(),
        new LobstrModule(),
        new HanaModule(),
      ],
    });

    kitClass = StellarWalletsKit;
    isInitialized = true;
  }

  return kitClass;
}
