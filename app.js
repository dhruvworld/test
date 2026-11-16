const DEFAULT_UPI = "paytm@paytm";
const DEFAULT_NAME = "Paytm Merchant";

const form = document.getElementById("paymentForm");
const mobileInput = document.getElementById("mobile");
const amountInput = document.getElementById("amount");
const noteInput = document.getElementById("note");
const pushBtn = document.getElementById("pushBtn");
const btnLabel = pushBtn.querySelector(".btn-label");
const btnSpinner = pushBtn.querySelector(".btn-spinner");
const toast = document.getElementById("toast");
const qrImage = document.getElementById("qrImage");
const upiDisplay = document.getElementById("upiDisplay");

const mobileError = document.getElementById("mobileError");
const amountError = document.getElementById("amountError");

let toastTimer;

function isValidMobile(value) {
  return /^[6-9]\d{9}$/.test(value);
}

function isValidAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1;
}

function setFieldValidity(input, errorEl, valid) {
  const field = input.closest(".field");
  field.classList.toggle("invalid", !valid);
  errorEl.hidden = valid;
}

function buildUpiLink({ upiId, name, amount, note }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    cu: "INR",
  });

  if (amount) params.set("am", String(amount));
  if (note) params.set("tn", note);

  return `upi://pay?${params.toString()}`;
}

function updateQr() {
  const amount = amountInput.value.trim();
  const note = noteInput.value.trim();
  const upiLink = buildUpiLink({
    upiId: DEFAULT_UPI,
    name: DEFAULT_NAME,
    amount: isValidAmount(amount) ? amount : "",
    note,
  });

  upiDisplay.textContent = DEFAULT_UPI;
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
}

function showToast(message, ok = true) {
  clearTimeout(toastTimer);
  toast.hidden = false;
  toast.textContent = message;
  toast.classList.toggle("ok", ok);
  requestAnimationFrame(() => toast.classList.add("show"));
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.hidden = true;
    }, 250);
  }, 2800);
}

function setLoading(loading) {
  pushBtn.disabled = loading;
  btnSpinner.hidden = !loading;
  btnLabel.textContent = loading ? "Pushing…" : "Push payment request";
}

function saveLocal(entry) {
  const key = "paytm_payment_pushes";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.unshift(entry);
  localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));
}

mobileInput.addEventListener("input", () => {
  mobileInput.value = mobileInput.value.replace(/\D/g, "").slice(0, 10);
  if (mobileInput.value.length === 10) {
    setFieldValidity(mobileInput, mobileError, isValidMobile(mobileInput.value));
  }
});

amountInput.addEventListener("input", () => {
  updateQr();
  if (amountInput.value !== "") {
    setFieldValidity(amountInput, amountError, isValidAmount(amountInput.value));
  }
});

noteInput.addEventListener("input", updateQr);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const mobile = mobileInput.value.trim();
  const amount = amountInput.value.trim();
  const note = noteInput.value.trim();

  const mobileOk = isValidMobile(mobile);
  const amountOk = isValidAmount(amount);

  setFieldValidity(mobileInput, mobileError, mobileOk);
  setFieldValidity(amountInput, amountError, amountOk);

  if (!mobileOk || !amountOk) {
    showToast("Fix the highlighted fields first", false);
    return;
  }

  setLoading(true);

  // Simulated push to Paytm / UPI collect request
  await new Promise((resolve) => setTimeout(resolve, 900));

  const entry = {
    mobile: `+91${mobile}`,
    amount: Number(amount),
    note: note || null,
    upi: DEFAULT_UPI,
    pushedAt: new Date().toISOString(),
  };

  saveLocal(entry);
  setLoading(false);
  showToast(`Payment request of ₹${amount} pushed to +91 ${mobile}`);
  form.reset();
  updateQr();
  mobileError.hidden = true;
  amountError.hidden = true;
  document.querySelectorAll(".field.invalid").forEach((el) => el.classList.remove("invalid"));
});

updateQr();
