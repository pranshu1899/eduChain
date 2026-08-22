import { Link } from "react-router-dom";

interface UniversityTopbarProps {
  walletAddress: string;
  connected: boolean;
}

function shortAddress(address: string) {
  if (!address) return "Not connected";
  if (address.length < 12) return address;

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function UniversityTopbar({
  walletAddress,
  connected,
}: UniversityTopbarProps) {
  return (
    <header className="university-topbar">

      <div className="university-breadcrumb">
        <Link to="/university">
          EduProof
        </Link>

        <span>/</span>

        <strong>University Portal</strong>
      </div>

      <div className="university-network">

        <div className="network-info">
          <span className="network-dot" />
          <div>
            <span className="network-label">
              NETWORK
            </span>

            <strong>
              Ethereum Sepolia
            </strong>
          </div>
        </div>

        <div className="wallet-info">

          <div className="wallet-avatar">
            U
          </div>

          <div className="wallet-details">
            <span className="wallet-label">
              UNIVERSITY ISSUER
            </span>

            <strong>
              {shortAddress(walletAddress)}
            </strong>
          </div>

          <span
            className={
              connected
                ? "wallet-status connected"
                : "wallet-status"
            }
          >
            <span className="status-dot" />
            {connected ? "Connected" : "Disconnected"}
          </span>

        </div>

      </div>
    </header>
  );
}