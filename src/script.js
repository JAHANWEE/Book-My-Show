function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function clearToken() {
  localStorage.removeItem("token");
}

function getEmailFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email;
  } catch {
    return null;
  }
}

function updateUserBar() {
  const token = getToken();
  const loggedInEl = document.getElementById("user-logged-in");
  const openLoginBtn = document.getElementById("open-login-btn");
  const emailEl = document.getElementById("user-email");

  if (token) {
    loggedInEl.classList.remove("hidden");
    loggedInEl.classList.add("flex");
    openLoginBtn.classList.add("hidden");
    emailEl.textContent = getEmailFromToken(token) || "";
  } else {
    loggedInEl.classList.add("hidden");
    loggedInEl.classList.remove("flex");
    openLoginBtn.classList.remove("hidden");
  }
}

let activeTab = "login"; 
let pendingSeatId = null;

function openModal(seatId = null) {
  pendingSeatId = seatId;
  document.getElementById("auth-modal").classList.remove("hidden");
  document.getElementById("auth-email").value = "";
  document.getElementById("auth-password").value = "";
  showAuthError("");
  switchTab("login");
}

function closeModal() {
  document.getElementById("auth-modal").classList.add("hidden");
  pendingSeatId = null;
}

function showAuthError(msg) {
  const el = document.getElementById("auth-error");
  if (msg) {
    el.textContent = msg;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

function switchTab(tab) {
  activeTab = tab;
  const submitBtn = document.getElementById("auth-submit");
  const loginTab = document.getElementById("tab-login");
  const registerTab = document.getElementById("tab-register");

  const activeClasses = ["bg-emerald-500", "text-white"];
  const inactiveClasses = ["text-slate-400", "hover:text-white"];

  if (tab === "login") {
    loginTab.classList.add(...activeClasses);
    loginTab.classList.remove(...inactiveClasses);
    registerTab.classList.remove(...activeClasses);
    registerTab.classList.add(...inactiveClasses);
    submitBtn.textContent = "Login";
  } else {
    registerTab.classList.add(...activeClasses);
    registerTab.classList.remove(...inactiveClasses);
    loginTab.classList.remove(...activeClasses);
    loginTab.classList.add(...inactiveClasses);
    submitBtn.textContent = "Register";
  }
  showAuthError("");
}

async function loginUser(email, password) {
  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed.");
  return data.token;
}

async function registerUser(email, password) {
  const res = await fetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed.");
  return data.token;
}

async function bookSeat(id, seatData, td) {
  const name = prompt("Enter your name to confirm booking:");
  if (!name) return;

  const baseClasses =
    "w-32 h-32 rounded-2xl text-center align-middle text-2xl font-bold transition-all duration-300 select-none relative group";

  try {
    const res = await fetch(`/seats/${id}/${encodeURIComponent(name)}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();

    if (res.status === 401) {
      clearToken();
      updateUserBar();
      openModal(id);
      return;
    }

    if (!res.ok) {
      alert(data.error || "Could not book seat.");
      return;
    }

    alert("Booked successfully!");
    seatData.isbooked = 1;
    seatData.name = name;

    td.className = `${baseClasses} bg-rose-500/10 text-rose-500/60 border border-rose-500/20 cursor-not-allowed`;
    td.innerHTML = `
      <span class="relative z-10">${id}</span>
      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-slate-900 border border-slate-700 text-sm text-slate-300 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-2xl z-50 pointer-events-none font-normal shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
        Booked by: <span class="font-bold text-white ml-1">${name}</span>
        <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-slate-700"></div>
        <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-[5px] border-transparent border-t-slate-900"></div>
      </div>`;
  } catch (ex) {
    alert("Error booking seat: " + ex.message);
  }
}

async function run() {
  const tbl = document.getElementById("tbl");
  const res = await fetch("/seats");
  const seats = (await res.json()).sort((a, b) => a.id - b.id);

  const baseClasses =
    "w-32 h-32 rounded-2xl text-center align-middle text-2xl font-bold transition-all duration-300 select-none relative group";

  let tr;
  for (let i = 0; i < seats.length; i++) {
    if (i % 8 === 0) tr = document.createElement("tr");

    const td = document.createElement("td");
    const seat = seats[i];

    if (seat.isbooked) {
      td.className = `${baseClasses} bg-rose-500/10 text-rose-500/60 border border-rose-500/20 cursor-not-allowed`;
      td.innerHTML = `
        <span class="relative z-10">${seat.id}</span>
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-slate-900 border border-slate-700 text-sm text-slate-300 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-2xl z-50 pointer-events-none font-normal shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
          Booked by: <span class="font-bold text-white ml-1">${seat.name}</span>
          <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-slate-700"></div>
          <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-[5px] border-transparent border-t-slate-900"></div>
        </div>`;
    } else {
      td.className = `${baseClasses} bg-emerald-500 text-white border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer hover:bg-emerald-400 hover:-translate-y-1.5 hover:shadow-[0_10px_25px_rgba(16,185,129,0.5)] active:scale-95`;
      td.innerHTML = `<span class="relative z-10">${seat.id}</span>`;

      td.addEventListener("click", () => {
        if (seat.isbooked) return;
        if (!getToken()) {
          openModal(seat.id);
          td.dataset.pendingBook = "true";
        } else {
          bookSeat(seat.id, seat, td);
        }
      });
    }

    tr.appendChild(td);
    tbl.appendChild(tr);
  }

  window._bookPendingSeat = async () => {
    if (pendingSeatId === null) return;
    const id = pendingSeatId;
    const allTds = tbl.querySelectorAll("td");
    for (const cell of allTds) {
      const span = cell.querySelector("span");
      if (span && parseInt(span.textContent) === id) {
        const seat = seats.find((s) => s.id === id);
        if (seat && !seat.isbooked) {
          await bookSeat(id, seat, cell);
        }
        break;
      }
    }
  };
}

document.getElementById("modal-close").addEventListener("click", closeModal);
document.getElementById("auth-modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});

document.getElementById("tab-login").addEventListener("click", () => switchTab("login"));
document.getElementById("tab-register").addEventListener("click", () => switchTab("register"));

document.getElementById("auth-submit").addEventListener("click", async () => {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;

  if (!email || !password) {
    showAuthError("Email and password are required.");
    return;
  }

  const btn = document.getElementById("auth-submit");
  btn.disabled = true;
  btn.textContent = "Please wait...";

  try {
    const token = activeTab === "login"
      ? await loginUser(email, password)
      : await registerUser(email, password);

    setToken(token);
    updateUserBar();
    closeModal();
    await window._bookPendingSeat();
  } catch (err) {
    showAuthError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = activeTab === "login" ? "Login" : "Register";
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  clearToken();
  updateUserBar();
});

document.getElementById("open-login-btn").addEventListener("click", () => {
  openModal(null);
});

updateUserBar();
run();
