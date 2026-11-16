const form = document.getElementById("paymentForm");
const qrFile = document.getElementById("qrFile");
const qrEmpty = document.getElementById("qrEmpty");
const qrPreview = document.getElementById("qrPreview");
const qrImage = document.getElementById("qrImage");
const qrChange = document.getElementById("qrChange");
const qrField = document.getElementById("qrField");
const mobileInput = document.getElementById("mobile");
const amountInput = document.getElementById("amount");
const pushBtn = document.getElementById("pushBtn");
const btnLabel = pushBtn.querySelector(".btn-label");
const btnSpinner = pushBtn.querySelector(".btn-spinner");
const toast = document.getElementById("toast");

const qrError = document.getElementById("qrError");
const mobileError = document.getElementById("mobileError");
const amountError = document.getElementById("amountError");

let toastTimer;
let qrDataUrl = "";

function isValidMobile(value) {
  return /^[6-9]\d{9}$/.test(value);
}

function isValidAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1;
}

function setFieldValidity(el, errorEl, valid) {
  const field = el.closest(".field");
  field.classList.toggle("invalid", !valid);
  errorEl.hidden = valid;
}

function showQrPreview(dataUrl) {
  qrDataUrl = dataUrl;
  qrImage.src = dataUrl;
  qrEmpty.hidden = true;
  qrPreview.hidden = false;
  setFieldValidity(qrField, qrError, true);
}

function clearQrPreview() {
  qrDataUrl = "";
  qrImage.src = "";
  qrFile.value = "";
  qrEmpty.hidden = false;
  qrPreview.hidden = true;
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
  btnLabel.textContent = loading ? "Pushing…" : "Push payment details";
}

function saveLocal(entry) {
  const key = "paytm_payment_details";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.unshift(entry);
  localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));
}

qrFile.addEventListener("change", () => {
  const file = qrFile.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    clearQrPreview();
    setFieldValidity(qrField, qrError, false);
    showToast("Please choose an image file", false);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => showQrPreview(String(reader.result));
  reader.readAsDataURL(file);
});

qrChange.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  qrFile.click();
});

mobileInput.addEventListener("input", () => {
  mobileInput.value = mobileInput.value.replace(/\D/g, "").slice(0, 10);
  if (mobileInput.value.length === 10) {
    setFieldValidity(mobileInput, mobileError, isValidMobile(mobileInput.value));
  }
});

amountInput.addEventListener("input", () => {
  if (amountInput.value !== "") {
    setFieldValidity(amountInput, amountError, isValidAmount(amountInput.value));
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const mobile = mobileInput.value.trim();
  const amount = amountInput.value.trim();
  const qrOk = Boolean(qrDataUrl);
  const mobileOk = isValidMobile(mobile);
  const amountOk = isValidAmount(amount);

  setFieldValidity(qrField, qrError, qrOk);
  setFieldValidity(mobileInput, mobileError, mobileOk);
  setFieldValidity(amountInput, amountError, amountOk);

  if (!qrOk || !mobileOk || !amountOk) {
    showToast("Add QR, amount, and a valid mobile number", false);
    return;
  }

  setLoading(true);
  await new Promise((resolve) => setTimeout(resolve, 900));

  const entry = {
    qrImage: qrDataUrl,
    amount: Number(amount),
    mobile: `+91${mobile}`,
    pushedAt: new Date().toISOString(),
  };

  saveLocal(entry);
  setLoading(false);
  showToast(`Details pushed — ₹${amount} for +91 ${mobile}`);
  form.reset();
  clearQrPreview();
  qrError.hidden = true;
  mobileError.hidden = true;
  amountError.hidden = true;
  document.querySelectorAll(".field.invalid").forEach((el) => el.classList.remove("invalid"));
});
