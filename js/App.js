// ═══════════════════════════════════════════════════════
// CertChain v2 — App.js
// ═══════════════════════════════════════════════════════

const projectId = "28LuNAotbXzcvtpOcE9F8ayKOeP";
const projectSecret = "3de3d9c099c6c0c168e39b8bc03e2f7a";

window.CONTRACT = {
  address: "0xFCFDE578aA6aE9A0B7694ef8BF9c713B4D958FEF",
  network: "https://polygon-rpc.com/",
  explore: "https://polygonscan.com",
  abi: [
    {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
    {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_exporter","type":"address"},{"indexed":false,"internalType":"string","name":"_ipfsHash","type":"string"},{"indexed":false,"internalType":"uint256","name":"_expiryTime","type":"uint256"}],"name":"addHash","type":"event"},
    {"inputs":[{"internalType":"bytes32","name":"hash","type":"bytes32"},{"internalType":"string","name":"_ipfs","type":"string"}],"name":"addDocHash","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"_add","type":"address"},{"internalType":"string","name":"_info","type":"string"}],"name":"add_Exporter","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"_add","type":"address"},{"internalType":"string","name":"_newInfo","type":"string"}],"name":"alter_Exporter","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"count_Exporters","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"count_hashes","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"bytes32","name":"_hash","type":"bytes32"}],"name":"deleteHash","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"address","name":"_add","type":"address"}],"name":"delete_Exporter","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"bytes32","name":"_hash","type":"bytes32"}],"name":"findDocHash","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"_add","type":"address"}],"name":"getExporterInfo","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}
  ]
};

// ── Auth ─────────────────────────────────────────────
async function connect() {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      window.userAddress = accounts[0];
      window.localStorage.setItem("userAddress", window.userAddress);
      window.location.reload();
    } catch {}
  } else {
    document.querySelector(".alert")?.classList.remove("d-none");
  }
}

function disconnect() {
  window.userAddress = null;
  window.localStorage.setItem("userAddress", null);
  window.location.reload();
}

// ── Init ─────────────────────────────────────────────
window.onload = async () => {
  $(".loader-wraper").fadeOut("slow");
  hide_txInfo();
  $("#upload_file_button").attr("disabled", true);
  $("#loginButton").hide();
  $("#recent-header").hide();

  window.userAddress = window.localStorage.getItem("userAddress");

  if (window.location.href.indexOf("verify.html") > -1) {
    $("#loader").hide();
    checkURL();
  }

  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    window.contract = new window.web3.eth.Contract(window.CONTRACT.abi, window.CONTRACT.address);

    if (window.userAddress && window.userAddress.length > 10) {
      $("#logoutButton").show();
      $("#loginButton").hide();
      $("#userAddress").html(`<i class="fa-solid fa-address-card me-2" style="color:var(--accent)"></i>
        ${truncateAddress(window.userAddress)}
        <a href="${window.CONTRACT.explore}/address/${window.userAddress}" target="_blank" style="color:var(--accent-2);margin-left:6px"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`);

      if (window.location.pathname.includes("admin.html")) await getCounters();
      await getExporterInfo();
      await get_ChainID();
      await get_ethBalance();
      $("#Exporter-info").html(`<i class="fa-solid fa-building-columns me-2" style="color:var(--warning)"></i>${window.info}`);
      setTimeout(() => listen(), 0);
    } else {
      $("#logoutButton").hide();
      $("#loginButton").show();
      $("#upload_file_button").attr("disabled", true);
      $("#doc-file").attr("disabled", true);
      $(".box").addClass("d-none");
      $(".loading-tx").addClass("d-none");
    }
  } else {
    $("#logoutButton, #loginButton").hide();
    $(".box").addClass("d-none");
    document.querySelector(".alert")?.classList.remove("d-none");
  }
};

// ── Hashing ──────────────────────────────────────────
function get_Sha3() {
  hide_txInfo();
  setNote("warning", "Hashing document...");
  $("#upload_file_button").attr("disabled", false);
  const file = document.getElementById("doc-file").files[0];
  if (!file) { window.hashedfile = null; return; }

  // Show file name in drop zone if element exists
  const fn = document.getElementById("file-selected-name");
  if (fn) { fn.textContent = file.name; fn.style.display = "block"; }

  const reader = new FileReader();
  reader.readAsText(file, "UTF-8");
  reader.onload = evt => {
    window.hashedfile = web3.utils.soliditySha3(evt.target.result);
    setNote("info", `Document hashed successfully`);
    runNewFeatures(file, evt.target.result);
  };
  reader.onerror = () => setNote("danger", "Error reading file");
}

// ── Features 1,2,4,5 runner ──────────────────────────
async function runNewFeatures(file, textContent) {
  // Feature 5: PDF Metadata
  if (window.PDFMeta) {
    const meta = await window.PDFMeta.extractPDFMetadata(file);
    renderMetadata(meta);
  }
  // Feature 1 + 4: Dual hash + avalanche
  if (window.CryptoUtils) {
    const buf = new TextEncoder().encode(textContent);
    const sha256 = await window.CryptoUtils.computeSHA256(buf);
    const keccak = window.hashedfile;
    document.getElementById("sha256-val").textContent = sha256;
    document.getElementById("keccak-val").textContent = keccak;
    document.getElementById("hash-panel")?.style && (document.getElementById("hash-panel").style.display = "block");

    // Avalanche: modify 1 char
    const mod = textContent.slice(0,-1) + (textContent.slice(-1)==="X"?"Y":"X");
    const k2  = web3.utils.soliditySha3(mod);
    renderAvalanche(keccak.replace("0x",""), k2.replace("0x",""));
    document.getElementById("hash-comparison").style.display = "block";
  }
  // Feature 2: Enable sign button
  const sb = document.getElementById("sign-btn");
  if (sb) sb.disabled = false;
  document.getElementById("signature-panel")?.style && (document.getElementById("signature-panel").style.display = "block");
  document.getElementById("metadata-panel")?.style && (document.getElementById("metadata-panel").style.display = "block");
}

function renderMetadata(meta) {
  const fields = [
    ["fileName","File Name"],["fileSize","Size"],["fileType","Type"],["lastModified","Modified"],
    ["title","Title"],["author","Author"],["subject","Subject"],["creator","Creator"],
    ["detectedName","Student Name"],["detectedDate","Issue Date"],["detectedInstitution","Institution"]
  ];
  let html = "", count = 0;
  fields.forEach(([k,label]) => {
    if (meta[k]) {
      html += `<div class="meta-item"><div class="meta-key">${label}</div><div class="meta-val" title="${meta[k]}">${meta[k]}</div></div>`;
      count++;
    }
  });
  if (!count) html = `<div class="meta-item" style="grid-column:1/-1"><div class="meta-key">Info</div><div class="meta-val" style="color:var(--text-3)">No embedded metadata found</div></div>`;
  document.getElementById("meta-grid").innerHTML = html;
}

function renderAvalanche(h1, h2) {
  const toBits = h => h.split("").map(c=>parseInt(c,16).toString(2).padStart(4,"0")).join("");
  const b1=toBits(h1), b2=toBits(h2);
  let changed=0;
  for(let i=0;i<Math.min(b1.length,b2.length);i++) if(b1[i]!==b2[i]) changed++;
  const pct=((changed/b1.length)*100).toFixed(1);
  const bar=document.getElementById("avalanche-bar");
  const pctEl=document.getElementById("avalanche-pct");
  if(bar) bar.style.width=pct+"%";
  if(pctEl) pctEl.textContent=pct+"% bits flipped";
  let hexHtml="";
  for(let i=0;i<Math.min(h1.length,64);i++)
    hexHtml+=`<div class="hex-cell ${h1[i]!==h2[i]?'changed':'same'}">${h1[i]}</div>`;
  const hg=document.getElementById("hex-grid");
  if(hg) hg.innerHTML=hexHtml;
  const note=document.getElementById("avalanche-note");
  if(note){ note.style.display="block"; note.innerHTML=`<i class="fa-solid fa-check-circle" style="color:var(--accent-3)"></i> Changing 1 char flipped <strong style="color:var(--accent-3)">${changed}/256 bits (${pct}%)</strong>. Ideal avalanche ≈ 50% — confirms Keccak-256 is cryptographically secure.`; }
}

async function doSign() {
  if (!window.hashedfile) { alert("Select a file first"); return; }
  const btn=document.getElementById("sign-btn");
  btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Signing...';
  try {
    const {signature,method}=await window.SignatureUtils.signCertificateHash(window.hashedfile);
    document.getElementById("sig-hex").textContent=signature;
    document.getElementById("sig-signer").textContent=window.userAddress;
    document.getElementById("sig-method").textContent=method;
    document.getElementById("stored-signature").value=signature;
    document.getElementById("sig-result").style.display="block";
    btn.innerHTML='<i class="fa-solid fa-check"></i> Signed';
  } catch(e) {
    btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-pen-nib"></i> Sign with MetaMask';
    setNote("danger","Signing cancelled or failed.");
  }
}

function copyHash(id) {
  const el=document.getElementById(id);
  if(!el) return;
  navigator.clipboard.writeText(el.textContent).then(()=>{
    document.querySelectorAll(".copy-btn").forEach(b=>{ if(b.onclick?.toString().includes(id)){ b.textContent="Copied!"; setTimeout(()=>b.textContent="Copy",1500); }});
  });
}

// ── Verify ───────────────────────────────────────────
async function verify_Hash() {
  if (!window.hashedfile) return;
  $("#loader").show();
  await contract.methods.findDocHash(window.hashedfile)
    .call({ from: window.userAddress || window.CONTRACT.address })
    .then(result => {
      $(".transaction-status").removeClass("d-none");
      window.verifyResult = result;
      const verified = result[0] != 0 && result[1] != 0;
      print_verification_info(result, verified);
      renderVerifyFeatures(result, verified);
    });
}

function checkURL() {
  const url = new URL(window.location.href);
  window.hashedfile = url.searchParams.get("hash");
  if (window.hashedfile) verify_Hash();
}

function print_verification_info(result, is_verified) {
  document.getElementById("student-document").src = "./files/notvalid.svg";
  $("#loader").hide();
  if (!is_verified) {
    $("#download-document").hide();
    $("#doc-status").html(`<div class="d-flex align-items-center gap-2" style="color:var(--danger)"><i class="fa-solid fa-circle-xmark fa-lg"></i><span style="font-weight:700">Certificate Not Verified</span></div>`);
    $("#file-hash").html(`<i class="fa-solid fa-hashtag"></i> ${truncateAddress(window.hashedfile)}`);
    $("#college-name,#contract-address,#time-stamps,#blockNumber").hide();
  } else {
    $("#download-document").show();
    $("#college-name,#contract-address,#time-stamps,#blockNumber").show();
    const t = new Date(parseInt(result[1]) * 1000);
    $("#doc-status").html(`<div class="d-flex align-items-center gap-2" style="color:var(--success)"><i class="fa-solid fa-circle-check fa-lg"></i><span style="font-weight:700">Certificate Verified Successfully</span></div>`);
    $("#file-hash").html(`<i class="fa-solid fa-hashtag"></i> ${truncateAddress(window.hashedfile)}`);
    $("#college-name").html(`<i class="fa-solid fa-graduation-cap"></i> ${result[2]}`);
    $("#contract-address").html(`<i class="fa-solid fa-file-contract"></i> ${truncateAddress(window.CONTRACT.address)}`);
    $("#time-stamps").html(`<i class="fa-solid fa-clock"></i> ${t.toLocaleString("en-IN")}`);
    $("#blockNumber").html(`<i class="fa-solid fa-cube"></i> Block #${result[0]}`);
    document.getElementById("student-document").src = `https://ipfs.io/ipfs/${result[3]}`;
    document.getElementById("download-document").href = `https://ipfs.io/ipfs/${result[3]}`;
  }
  $(".transaction-status").show();
}

// Features 3 + 2 on verify page
function renderVerifyFeatures(result, verified) {
  showStatusBanner(verified, result);
  if (verified) {
    showTimeline(result);
    const sp = document.getElementById("sig-verify-panel");
    if (sp) sp.style.display = "block";
  }
}

function showStatusBanner(verified, result) {
  const el = document.getElementById("cert-status-banner");
  if (!el) return;
  if (!verified) {
    el.className = "cert-status-banner invalid";
    el.innerHTML = `<div class="status-icon" style="color:var(--danger)"><i class="fa-solid fa-circle-xmark"></i></div><div><div class="status-title" style="color:var(--danger)">Not Registered on Blockchain</div><div class="status-sub">Hash not found — document may be tampered, unissued, or from a different network.</div></div>`;
    el.style.display = "flex";
    return;
  }
  const mineTime = parseInt(result[1]);
  const age = window.CertStatus ? window.CertStatus.getCertAge(mineTime) : null;
  const ageText = age ? age.ageText : "";
  if (age && age.expired) {
    el.className = "cert-status-banner expired";
    el.innerHTML = `<div class="status-icon" style="color:var(--warning)"><i class="fa-solid fa-clock-rotate-left"></i></div><div><div class="status-title" style="color:var(--warning)">Certificate Expired <span style="font-size:.72rem;background:rgba(255,171,64,.15);color:var(--warning);padding:2px 10px;border-radius:50px;margin-left:6px">${ageText} ago</span></div><div class="status-sub">Hash exists on-chain but certificate has exceeded its validity period. Contact the issuer.</div></div>`;
  } else {
    el.className = "cert-status-banner valid";
    el.innerHTML = `<div class="status-icon" style="color:var(--success)"><i class="fa-solid fa-circle-check"></i></div><div><div class="status-title" style="color:var(--success)">Valid & Authentic <span style="font-size:.72rem;background:rgba(0,230,118,.15);color:var(--success);padding:2px 10px;border-radius:50px;margin-left:6px">${ageText} old</span></div><div class="status-sub">Hash verified on blockchain. Document integrity confirmed — has not been tampered with.</div></div>`;
  }
  el.style.display = "flex";
}

function showTimeline(result) {
  const el = document.getElementById("timeline-panel");
  const tc = document.getElementById("timeline-content");
  if (!el || !tc) return;
  const t = new Date(parseInt(result[1]) * 1000);
  tc.innerHTML = `
    <div class="tl-item"><div class="tl-dot dg"></div><div class="tl-label">Certificate Issued</div><div class="tl-value">${t.toLocaleString("en-IN")}</div><div class="tl-note">Certificate hashed and submitted to blockchain by the issuing institution.</div></div>
    <div class="tl-item"><div class="tl-dot db"></div><div class="tl-label">Block Mined</div><div class="tl-value">Block #${result[0]}</div><div class="tl-note">Transaction confirmed and included in a block — permanently immutable from this point.</div></div>
    <div class="tl-item"><div class="tl-dot dc"></div><div class="tl-label">Smart Contract</div><div class="tl-value">${truncateAddress(window.CONTRACT.address)}</div><div class="tl-note">Hash stored in the Verification contract. Cannot be altered retroactively on any node.</div></div>
    <div class="tl-item"><div class="tl-dot da"></div><div class="tl-label">Issuing Institution</div><div class="tl-value">${result[2] || "—"}</div><div class="tl-note">Registered exporter (institution) that uploaded this certificate to the network.</div></div>
    <div class="tl-item"><div class="tl-dot db"></div><div class="tl-label">Document Hash (Keccak-256)</div><div class="tl-value">${window.hashedfile}</div><div class="tl-note">Any single-byte change to the document produces a completely different hash — avalanche property.</div></div>
    <div class="tl-item"><div class="tl-dot dp"></div><div class="tl-label">Verified Now</div><div class="tl-value">${new Date().toLocaleString("en-IN")}</div><div class="tl-note">Real-time verification against live blockchain state. No central server involved.</div></div>`;
  el.style.display = "block";
}

async function verifySig() {
  const sig = document.getElementById("sig-input").value.trim();
  const res = document.getElementById("sig-verify-result");
  if (!sig || !window.hashedfile) {
    res.style.display="block"; res.innerHTML=`<div style="color:var(--danger);font-size:.875rem"><i class="fa-solid fa-triangle-exclamation"></i> Select the document and paste a signature first.</div>`; return;
  }
  try {
    const msgHex="0x"+Array.from(new TextEncoder().encode("CertChain cert: "+window.hashedfile)).map(b=>b.toString(16).padStart(2,"0")).join("");
    let recovered=null;
    try { recovered = web3.eth.accounts.recover(web3.utils.soliditySha3(window.hashedfile), sig); } catch {}
    if (!recovered) try { recovered = web3.eth.accounts.recover(msgHex, sig); } catch {}
    res.style.display="block";
    if (recovered) {
      res.innerHTML=`<div style="background:rgba(0,230,118,.06);border:1px solid rgba(0,230,118,.25);border-radius:10px;padding:14px 16px"><div style="color:var(--success);font-weight:700;margin-bottom:8px"><i class="fa-solid fa-check-circle"></i> Signature Decoded (ECDSA secp256k1)</div><div style="font-size:.72rem;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Recovered Signing Address</div><div style="font-family:var(--font-mono);font-size:.8rem;color:var(--accent-2);word-break:break-all">${recovered}</div><div style="font-size:.78rem;color:var(--text-2);margin-top:10px">Cross-check this address against your Admin panel exporter list to confirm authenticity.</div></div>`;
    } else {
      res.innerHTML=`<div style="color:var(--danger);font-size:.875rem"><i class="fa-solid fa-circle-xmark"></i> Could not recover signer — signature may be invalid or incompatible format.</div>`;
    }
  } catch(e) {
    res.style.display="block"; res.innerHTML=`<div style="color:var(--danger);font-size:.875rem"><i class="fa-solid fa-circle-xmark"></i> Error: ${e.message}</div>`;
  }
}

// ── Upload ───────────────────────────────────────────
async function sendHash() {
  $("#loader").show();
  $("#upload_file_button").slideUp();
  setNote("info", "Please confirm the transaction in MetaMask...");
  get_ChainID();
  try {
    const CID = await uploadFileToIpfs();
    if (window.hashedfile && window.hashedfile.length > 4) {
      await window.contract.methods.addDocHash(window.hashedfile, CID)
        .send({ from: window.userAddress })
        .on("transactionHash", () => setNote("info","Waiting for block confirmation..."))
        .on("receipt", receipt => { printUploadInfo(receipt); generateQRCode(); })
        .on("error", err => { setNote("danger", err.message); $("#loader").hide(); $("#upload_file_button").slideDown(); });
    }
  } catch(e) { setNote("danger", e.message); $("#loader").hide(); $("#upload_file_button").slideDown(); }
}

async function uploadFileToIpfs() {
  const file = document.getElementById("doc-file").files[0];
  const formData = new FormData();
  formData.append("file", file);
  const auth = "Basic " + btoa(`${projectId}:${projectSecret}`);
  const response = await fetch("https://ipfs.infura.io:5001/api/v0/add", { method:"POST", body:formData, headers:{ Authorization:auth } });
  if (!response.ok) throw new Error("IPFS upload failed");
  const data = await response.json();
  return data["Hash"];
}

function printUploadInfo(result) {
  const explorer = window.CONTRACT.explore;
  $("#transaction-hash").html(`<i class="fa-solid fa-check-circle"></i> <a href="${explorer}/tx/${result.transactionHash}" target="_blank" style="color:var(--accent-2)">${truncateAddress(result.transactionHash)}</a>`);
  $("#file-hash").html(`<i class="fa-solid fa-hashtag"></i> ${truncateAddress(window.hashedfile)}`);
  $("#contract-address").html(`<i class="fa-solid fa-file-contract"></i> ${truncateAddress(result.to)}`);
  $("#time-stamps").html(`<i class="fa-solid fa-clock"></i> ${getTime()}`);
  $("#blockNumber").html(`<i class="fa-solid fa-cube"></i> ${result.blockNumber}`);
  $("#blockHash").html(`<i class="fa-solid fa-shield"></i> ${truncateAddress(result.blockHash)}`);
  $("#gas-used").html(`<i class="fa-solid fa-gas-pump"></i> ${result.gasUsed} gas`);
  $("#loader").hide();
  $("#upload_file_button").slideDown();
  show_txInfo();
  get_ethBalance();
  setNote("success", "Transaction confirmed on blockchain!");
  listen();
}

// ── Delete ───────────────────────────────────────────
async function deleteHash() {
  if (!window.hashedfile) return;
  $("#loader").show(); $("#upload_file_button").slideUp();
  setNote("info","Please confirm the transaction...");
  await window.contract.methods.deleteHash(window.hashedfile)
    .send({ from: window.userAddress })
    .on("transactionHash", () => setNote("info","Waiting for confirmation..."))
    .on("receipt", () => { setNote("success","Certificate hash deleted."); $("#loader").hide(); $("#upload_file_button").slideDown(); })
    .on("error", err => { setNote("danger",err.message); $("#loader").hide(); $("#upload_file_button").slideDown(); });
}

// ── Admin ────────────────────────────────────────────
async function addExporter() {
  const address = document.getElementById("Exporter-address").value;
  const info = document.getElementById("info").value;
  if (!address || !info) { setNote("warning","Please provide both address and institution name."); return; }
  adminBtnsLoading(true);
  try {
    await window.contract.methods.add_Exporter(address, info).send({ from: window.userAddress })
      .on("receipt", () => { setNote("success","Institution registered on blockchain!"); adminBtnsLoading(false); getCounters(); });
  } catch(e) { setNote("danger",e.message); adminBtnsLoading(false); }
}
async function editExporter() {
  const address = document.getElementById("Exporter-address").value;
  const info = document.getElementById("info").value;
  if (!address || !info) { setNote("warning","Please provide both fields."); return; }
  adminBtnsLoading(true);
  try {
    await window.contract.methods.alter_Exporter(address, info).send({ from: window.userAddress })
      .on("receipt", () => { setNote("success","Institution updated!"); adminBtnsLoading(false); });
  } catch(e) { setNote("danger",e.message); adminBtnsLoading(false); }
}
async function deleteExporter() {
  const address = document.getElementById("Exporter-address").value;
  if (!address) { setNote("warning","Please provide the address."); return; }
  adminBtnsLoading(true);
  try {
    await window.contract.methods.delete_Exporter(address).send({ from: window.userAddress })
      .on("receipt", () => { setNote("success","Institution removed!"); adminBtnsLoading(false); getCounters(); });
  } catch(e) { setNote("danger",e.message); adminBtnsLoading(false); }
}
function adminBtnsLoading(on) {
  if (on) { $("#loader").show(); $("#ExporterBtn,#edit,#delete").slideUp(); }
  else    { $("#loader").hide(); $("#ExporterBtn,#edit,#delete").slideDown(); }
}

// ── Helpers ───────────────────────────────────────────
function setNote(type, msg) {
  const colors = { info:"var(--accent-2)", success:"var(--success)", warning:"var(--warning)", danger:"var(--danger)" };
  $("#note").html(`<span style="color:${colors[type]||colors.info}">${msg}</span>`);
}
function hide_txInfo() { $(".transaction-status").addClass("d-none"); }
function show_txInfo()  { $(".transaction-status").removeClass("d-none"); }
function truncateAddress(a) { if(!a) return "—"; return `${a.substr(0,8)}...${a.substr(a.length-6)}`; }
function getTime() { return new Date().toLocaleString("en-IN"); }

async function get_ethBalance() {
  web3.eth.getBalance(window.userAddress, (err, bal) => {
    if (!err) $("#userBalance").html(`<i class="fa-brands fa-ethereum me-1" style="color:var(--accent-3)"></i>${web3.utils.fromWei(bal).substr(0,7)}`);
  });
}
async function get_ChainID() {
  const id = await web3.eth.getChainId();
  const names = {1:"Ethereum Mainnet",137:"Polygon Mainnet",80001:"Polygon Mumbai",11155111:"Sepolia Testnet",5:"Goerli Testnet"};
  window.chainID = names[id] || `Chain ${id}`;
  const el = document.getElementById("network");
  if (el) el.innerHTML = `<i class="fa-solid fa-circle-nodes me-1" style="color:var(--accent-2)"></i>${window.chainID}`;
}
async function getExporterInfo() {
  const result = await window.contract.methods.getExporterInfo(window.userAddress).call({ from: window.userAddress });
  window.info = result;
}
async function getCounters() {
  const exp = await window.contract.methods.count_Exporters().call({ from: window.userAddress });
  const hash = await window.contract.methods.count_hashes().call({ from: window.userAddress });
  $("#num-exporters").html(`<span class="counter-value">${exp}</span><div class="counter-label">Institutions</div>`);
  $("#num-hashes").html(`<span class="counter-value">${hash}</span><div class="counter-label">Certificates</div>`);
}

// ── QR Code ───────────────────────────────────────────
function generateQRCode() {
  document.getElementById("qrcode").innerHTML = "";
  const qr = new QRCode(document.getElementById("qrcode"), { colorDark:"#6c63ff", colorLight:"#ffffff", correctLevel:QRCode.CorrectLevel.H });
  const url = `${window.location.host}/verify.html?hash=${window.hashedfile}`;
  qr.makeCode(url);
  document.getElementById("download-link").download = document.getElementById("doc-file").files[0].name;
  document.getElementById("verfiy").href = window.location.protocol + "//" + url;
  setTimeout(() => { document.getElementById("download-link").href = document.querySelector("#qrcode img").src; }, 500);
}

// ── Recent uploads ────────────────────────────────────
async function listen() {
  if (!window.location.pathname.includes("upload.html")) return;
  document.querySelector(".loading-tx")?.classList.remove("d-none");
  const latestBlock = await window.web3.eth.getBlockNumber();
  window.contract.getPastEvents("addHash", {
    filter: { _exporter: window.userAddress },
    fromBlock: latestBlock - 999, toBlock: "latest"
  }, (err, events) => { if(!err) printTransactions(events); });
}

function printTransactions(data) {
  document.querySelector(".transactions").innerHTML = "";
  document.querySelector(".loading-tx")?.classList.add("d-none");
  if (!data || !data.length) { $("#recent-header").hide(); return; }
  const main = document.querySelector(".transactions");
  data.forEach((tx, i) => {
    const a = document.createElement("a");
    a.href = `${window.CONTRACT.explore}/tx/${tx.transactionHash}`;
    a.target = "_blank";
    a.className = "col-lg-3 col-md-4 col-sm-6 m-2 card";
    a.style.cssText = "overflow:hidden;text-decoration:none;";
    const img = document.createElement("object");
    img.data = `https://ipfs.io/ipfs/${tx.returnValues._ipfsHash || tx.returnValues[1]}`;
    img.style.cssText = "width:100%;height:100%;";
    const num = document.createElement("div");
    num.textContent = i + 1;
    num.style.cssText = "position:absolute;left:6px;bottom:-10px;font-size:3.5rem;font-weight:800;color:rgba(108,99,255,0.18);font-family:var(--font-dis);pointer-events:none";
    a.appendChild(img); a.appendChild(num);
    main.prepend(a);
  });
  $("#recent-header").show();
}

// MetaMask account change
if (window.ethereum) window.ethereum.on("accountsChanged", accounts => { if(accounts[0]) connect(); else disconnect(); });
