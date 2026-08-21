import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function uploadMetadataToIPFS(
  metadata: object
): Promise<string> {
  const jwt = process.env.PINATA_JWT;

  if (!jwt) {
    throw new Error(
      "PINATA_JWT is not defined in .env"
    );
  }

  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      pinataContent: metadata
    },
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.IpfsHash;
}