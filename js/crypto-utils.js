// ═══════════════════════════════════════════════════════
// CertChain v2 — crypto-utils.js
// SHA-256, Avalanche, ECDSA Signing, PDF Metadata
// ═══════════════════════════════════════════════════════

// Feature 1: SHA-256 via Web Crypto API
async function computeSHA256(buffer) {
  const h = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2,"0")).join("");
}

// Feature 4: Hamming distance between two hex strings (bit level)
function hammingDistance(h1, h2) {
  let diff = 0;
  for (let i = 0; i < Math.min(h1.length, h2.length); i++) {
    const xor = parseInt(h1[i],16) ^ parseInt(h2[i],16);
    diff += xor.toString(2).split("1").length - 1;
  }
  return diff;
}

window.CryptoUtils = { computeSHA256, hammingDistance };

// Feature 2: ECDSA Digital Signature via MetaMask EIP-712
async function signCertificateHash(hashHex) {
  if (!window.ethereum || !window.userAddress) throw new Error("MetaMask not connected");
  const params = JSON.stringify({
    domain: { name: "CertChain", version: "2" },
    message: { action: "IssueCertificate", documentHash: hashHex, issuer: window.userAddress, timestamp: Math.floor(Date.now()/1000) },
    primaryType: "CertificateIssuance",
    types: {
      EIP712Domain: [{ name:"name",type:"string"},{ name:"version",type:"string"}],
      CertificateIssuance: [{ name:"action",type:"string"},{ name:"documentHash",type:"bytes32"},{ name:"issuer",type:"address"},{ name:"timestamp",type:"uint256"}]
    }
  });
  try {
    const sig = await window.ethereum.request({ method: "eth_signTypedData_v4", params: [window.userAddress, params] });
    return { signature: sig, method: "EIP-712 Typed Signature" };
  } catch {
    const msgBytes = new TextEncoder().encode("CertChain cert: " + hashHex);
    const msgHex = "0x" + Array.from(msgBytes).map(b=>b.toString(16).padStart(2,"0")).join("");
    const sig = await window.ethereum.request({ method: "personal_sign", params: [msgHex, window.userAddress] });
    return { signature: sig, method: "personal_sign (fallback)" };
  }
}

window.SignatureUtils = { signCertificateHash };

// Feature 3: Cert age/status helper
function getCertAge(mineTime) {
  if (!mineTime || mineTime == 0) return { valid: false, text: "Not found" };
  const now = Math.floor(Date.now()/1000);
  const ageSec = now - parseInt(mineTime);
  const days = Math.floor(ageSec / 86400);
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const ageText = years > 0 ? `${years}y ${months}m` : months > 0 ? `${months} months` : `${days} days`;
  return { valid: true, days, ageText, expired: days > 3650 };
}
window.CertStatus = { getCertAge };

// Feature 5: PDF Metadata extraction
async function extractPDFMetadata(file) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = e => {
      try {
        const bytes = new Uint8Array(e.target.result);
        const text = new TextDecoder("latin1").decode(bytes);
        const meta = {
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + " KB",
          fileType: file.type || "application/pdf",
          lastModified: new Date(file.lastModified).toLocaleDateString("en-IN"),
        };
        const infoMatch = text.match(/\/Info\s*<<([^>]+)>>/);
        if (infoMatch) {
          ["Title","Author","Subject","Creator","Producer","Keywords"].forEach(f => {
            const m = infoMatch[1].match(new RegExp(`\\/${f}\\s*\\(([^)]+)\\)`));
            if (m) meta[f.toLowerCase()] = m[1].replace(/[^\x20-\x7E]/g,"").trim();
          });
        }
        const nm = text.match(/(?:Student|Name|Recipient|Candidate)[:\s]+([A-Z][a-zA-Z ]{2,30})/);
        if (nm) meta.detectedName = nm[1].trim();
        const dm = text.match(/(?:Date|Issued|Awarded)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
        if (dm) meta.detectedDate = dm[1];
        const im = text.match(/(?:University|College|Institute|School)[^\n]{0,50}/i);
        if (im) meta.detectedInstitution = im[0].replace(/[^\x20-\x7E]/g,"").trim().slice(0,60);
        resolve(meta);
      } catch { resolve({ fileName: file.name, fileSize: (file.size/1024).toFixed(1)+" KB" }); }
    };
    r.readAsArrayBuffer(file);
  });
}
window.PDFMeta = { extractPDFMetadata };
