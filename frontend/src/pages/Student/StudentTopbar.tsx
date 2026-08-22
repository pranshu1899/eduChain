interface StudentTopbarProps {
  walletAddress: string;
  connected: boolean;
  onConnect: () => void;
}

function shortenAddress(
  address: string,
) {
  if (!address) {
    return "";
  }

  if (address.length <= 14) {
    return address;
  }

  return `${address.slice(
    0,
    6,
  )}...${address.slice(-4)}`;
}

export default function StudentTopbar({
  walletAddress,
  connected,
  onConnect,
}: StudentTopbarProps) {
  return (
    <header className="student-topbar">

      <div className="student-breadcrumb">

        EduProof

        <span>
          /
        </span>

        <strong>
          Student Portal
        </strong>

      </div>

      <div className="student-topbar-right">

        <div className="student-network">

          <span className="student-network-dot" />

          Ethereum Sepolia

        </div>

        {connected ? (

          <div className="student-wallet">

            <div className="student-wallet-icon">
              U
            </div>

            <div>

              <strong>
                {shortenAddress(
                  walletAddress,
                )}
              </strong>

              <span>
                Connected
              </span>

            </div>

          </div>

        ) : (

          <button
            type="button"
            className="student-connect-button"
            onClick={
              onConnect
            }
          >
            Connect Wallet
          </button>

        )}

      </div>

    </header>
  );
}