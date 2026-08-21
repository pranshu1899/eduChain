export interface VerifiableCredential {
  "@context": string[];

  type: string[];

  issuer: {
    id: string;
    name: string;
  };

  credentialSubject: {
    id: string;
    credentialType: string;
    institution: string;
    institutionId: string;
    degree: string;
    issueDate: string;
  };

  credentialVersion: number;

  proof: {
    type: string;
    credentialHash: string;
    signature: string;
  };
}

export function createVerifiableCredential(
  studentDID: string,
  issuerDID: string,
  issuerName: string,
  credentialType: string,
  institutionId: string,
  degree: string,
  issueDate: string,
  version: number,
  credentialHash: string,
  signature: string
): VerifiableCredential {
  return {
    "@context": [
      "https://www.w3.org/2018/credentials/v1"
    ],

    type: [
      "VerifiableCredential",
      "EducationalCredential"
    ],

    issuer: {
      id: issuerDID,
      name: issuerName
    },

    credentialSubject: {
      id: studentDID,
      credentialType,
      institution: issuerName,
      institutionId,
      degree,
      issueDate
    },

    credentialVersion: version,

    proof: {
      type: "EcdsaSecp256k1Signature",
      credentialHash,
      signature
    }
  };
}