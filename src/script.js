// ── Movie Data ────────────────────────────────────────────────────
const MOVIES = [
  {
    id: 1,
    title: "Dhurandhar: The Revenge",
    genre: "Action / Thriller",
    lang: "Hindi",
    rating: "UA",
    stars: "4.2",
    duration: "2h 28m",
    price: 280,
    poster: "/public/assets/Dhurandhar 2 Poster.jpg",
    times: ["10:00 AM", "1:30 PM", "5:00 PM", "9:15 PM"],
  },
  {
    id: 2,
    title: "Batman",
    genre: "Action / Superhero",
    lang: "English",
    rating: "UA",
    stars: "4.6",
    duration: "2h 56m",
    price: 320,
    poster: "/public/assets/BATMAN 🦇.jpg",
    times: ["10:00 AM", "1:30 PM", "5:00 PM", "9:15 PM"],
  },
  {
    id: 3,
    title: "Mulan",
    genre: "Adventure / Drama",
    lang: "English",
    rating: "U",
    stars: "4.1",
    duration: "1h 55m",
    price: 220,
    poster: "/public/assets/mulan1.png",
    times: ["10:00 AM", "1:30 PM", "5:00 PM", "9:15 PM"],
  },
  {
    id: 4,
    title: "Titanic",
    genre: "Romance / Drama",
    lang: "English",
    rating: "UA",
    stars: "4.8",
    duration: "3h 14m",
    price: 300,
    poster: "/public/assets/titanic.jpg",
    times: ["10:00 AM", "1:30 PM", "5:00 PM", "9:15 PM"],
  },
  {
    id: 5,
    title: "Log Kya Kahenge",
    genre: "Drama / Social",
    lang: "Hindi",
    rating: "U",
    stars: "3.7",
    duration: "2h 15m",
    price: 180,
    poster: "/public/assets/Log kya khahenge.jpg",
    times: ["10:00 AM", "1:30 PM", "5:00 PM", "9:15 PM"],
  },
  {
    id: 6,
    title: "Bulbbul",
    genre: "Horror / Fantasy",
    lang: "Hindi",
    rating: "A",
    stars: "3.9",
    duration: "1h 35m",
    price: 200,
    poster: "/public/assets/Bulbbul.jpg",
    times: ["10:00 AM", "1:30 PM", "5:00 PM", "9:15 PM"],
  },
  {
    id: 7,
    title: "Gangs of Wasseypur",
    genre: "Crime / Drama",
    lang: "Hindi",
    rating: "A",
    stars: "4.9",
    duration: "5h 21m",
    price: 350,
    poster: "/public/assets/Gangs of Wasseypur.jpg",
    times: ["10:00 AM", "1:30 PM", "5:00 PM", "9:15 PM"],
  },
  {
    id: 8,
    title: "Joker",
    genre: "Drama / Thriller",
    lang: "English",
    rating: "A",
    stars: "4.7",
    duration: "2h 2m",
    price: 310,
    poster: "/public/assets/Joker.jpg",
    times: ["10:00 AM", "1:30 PM", "5:00 PM", "9:15 PM"],
  },
  {
    id: 9,
    title: "American Psycho",
    genre: "Psychological Thriller",
    lang: "English",
    rating: "A",
    stars: "4.4",
    duration: "1h 42m",
    price: 260,
    poster: "/public/assets/american psycho poster.jpg",
    times: ["10:00 AM", "1:30 PM", "5:00 PM", "9:15 PM"],
  },
];

const MAX_SEATS = 4;

// ── Token helpers ─────────────────────────────────────────────────
const getToken = () => localStorage.getItem("token");
const setToken = (t) => localStorage.setItem("token", t);
const clearToken = () => localStorage.removeItem("token");
function getEmailFromToken(token) {
  try { return JSON.parse(atob(token.split(".")[1])).email; } catch { return null; }
}

// ── User bar ──────────────────────────────────────────────────────
function updateUserBar() {
  const token = getToken();
  const loggedIn = document.getElementById("user-logged-in");
  const loginBtn = document.getElementById("open-login-btn");
  const emailEl = document.getElementById("user-email");
  if (token) {
    loggedIn.classList.remove("hidden"); loggedIn.style.display = "flex";
    loginBtn.classList.add("hidden");
    emailEl.textContent = getEmailFromToken(token) || "User";
  } else {
    loggedIn.classList.add("hidden");
    loginBtn.classList.remove("hidden");
  }
}

// ── Auth modal ────────────────────────────────────────────────────
let activeTab = "login";
let pendingAction = null;

function openModal(onSuccess = null) {
  pendingAction = onSuccess;
  document.getElementById("auth-modal").classList.remove("hidden");
  document.getElementById("auth-email").value = "";
  document.getElementById("auth-password").value = "";
  showAuthError("");
  switchTab("login");
}
function closeModal() {
  document.getElementById("auth-modal").classList.add("hidden");
  pendingAction = null;
}
function showAuthError(msg) {
  const el = document.getElementById("auth-error");
  el.textContent = msg;
  el.classList.toggle("hidden", !msg);
}
function switchTab(tab) {
  activeTab = tab;
  document.getElementById("tab-login").classList.toggle("active", tab === "login");
  document.getElementById("tab-register").classList.toggle("active", tab === "register");
  document.getElementById("auth-submit").textContent = tab === "login" ? "Login" : "Register";
  showAuthError("");
}

async function loginUser(email, password) {
  const res = await fetch("/auth/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed.");
  return data.token;
}
async function registerUser(email, password) {
  const res = await fetch("/auth/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed.");
  return data.token;
}

// ── Pages ─────────────────────────────────────────────────────────
function showPage(id) {
  document.getElementById("page-movies").classList.toggle("hidden", id !== "movies");
  document.getElementById("page-seats").classList.toggle("hidden", id !== "seats");
  document.getElementById("page-bookings").classList.toggle("hidden", id !== "bookings");
}

// ── Movies Page ───────────────────────────────────────────────────
function renderMoviesPage() {
  showPage("movies");
  document.getElementById("page-movies").innerHTML = `
    <div class="movies-page">
      <div class="hero-banner">
        <div class="hero-text">
          <h1>Book Your <span>Perfect</span><br/>Movie Experience</h1>
          <p>4 blockbusters · Multiple shows · Best seats</p>
          <span class="hero-badge">🔥 Now Showing</span>
        </div>
      </div>
      <div class="section-title">Recommended Movies</div>
      <div class="movies-grid">
        ${MOVIES.map(m => `
          <div class="movie-card">
            <img class="movie-poster" src="${m.poster}" alt="${m.title}" />
            <div class="movie-info">
              <div class="movie-meta">
                <span class="badge">${m.rating}</span>
                <span class="badge badge-lang">${m.lang}</span>
                <span class="badge">${m.duration}</span>
              </div>
              <div class="movie-title">${m.title}</div>
              <div class="movie-genre">${m.genre}</div>
              <div class="movie-rating">★ ${m.stars} &nbsp;·&nbsp; ₹${m.price}</div>
              <div class="showtimes">
                ${m.times.map(t => `
                  <button class="showtime-btn" data-movie-id="${m.id}" data-time="${t}">${t}</button>
                `).join("")}
              </div>
              <button class="book-now-btn" data-movie-id="${m.id}" data-time="${m.times[0]}">Book Now</button>
            </div>
          </div>
        `).join("")}
        <div class="movie-card coming-soon-card">
          <div class="coming-soon-body">
            <div class="coming-soon-icon">🎬</div>
            <div class="coming-soon-text">Coming Soon</div>
            <div class="coming-soon-sub">Stay tuned for more</div>
          </div>
        </div>
      </div>
    </div>`;

  document.querySelectorAll(".showtime-btn, .book-now-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const movie = MOVIES.find(m => m.id === parseInt(btn.dataset.movieId));
      renderSeatsPage(movie, btn.dataset.time);
    });
  });
}

// ── Seats Page ────────────────────────────────────────────────────
async function renderSeatsPage(movie, time) {
  showPage("seats");
  document.getElementById("page-seats").innerHTML = `
    <div class="seats-page">
      <button class="back-btn" id="back-btn">← Back to movies</button>
      <div class="show-info">
        <div>
          <h2>${movie.title}</h2>
          <p>${movie.genre} &nbsp;·&nbsp; Show: <span>${time}</span> &nbsp;·&nbsp; ${movie.duration}</p>
        </div>
        <div class="price-tag">
          <small>Price per seat</small>
          <strong>₹${movie.price}</strong>
        </div>
      </div>
      <div class="screen-wrap">
        <div class="screen"></div>
        <div class="screen-label">All eyes this way please!</div>
      </div>
      <div class="legend">
        <div class="legend-item"><div class="legend-dot dot-available"></div> Available</div>
        <div class="legend-item"><div class="legend-dot dot-booked"></div> Booked</div>
        <div class="legend-item"><div class="legend-dot dot-selected"></div> Selected</div>
      </div>
      <div class="seat-grid-wrap" id="seat-grid-wrap">
        <div class="loading">Loading seats</div>
      </div>
    </div>
    <!-- Booking bar -->
    <div class="booking-bar" id="booking-bar">
      <div class="booking-bar-info">
        <span>Selected seats</span>
        <strong class="booking-bar-seats" id="bar-seats"></strong>
      </div>
      <div class="booking-bar-info" style="text-align:center">
        <span>Total</span>
        <strong id="bar-total"></strong>
      </div>
      <button class="btn-primary" id="bar-confirm">Confirm Booking</button>
    </div>`;

  document.getElementById("back-btn").addEventListener("click", () => {
    document.getElementById("booking-bar")?.classList.remove("visible");
    renderMoviesPage();
  });

  let seats, selectedIds = new Set();

  try {
    const res = await fetch(`/seats?movieId=${movie.id}&showTime=${encodeURIComponent(time)}`);
    seats = (await res.json()).sort((a, b) => a.seat_no - b.seat_no);
  } catch {
    document.getElementById("seat-grid-wrap").innerHTML = `<p style="color:#ff6b6b;text-align:center">Failed to load seats.</p>`;
    return;
  }

  // Theatre layout: rows with increasing seats per row (curved/fan shape)
  // Row config: [rowLabel, seatsInRow, seatNumberOffset]
  const ROW_CONFIG = [
    { label: "A", count: 6  },
    { label: "B", count: 8  },
    { label: "C", count: 10 },
    { label: "D", count: 10 },
    { label: "E", count: 12 },
    { label: "F", count: 12 },
    { label: "G", count: 12 },
    { label: "H", count: 12 },
    { label: "I", count: 10 },
    { label: "J", count: 8  },
  ]; // total = 100

  function renderGrid() {
    const wrap = document.getElementById("seat-grid-wrap");
    if (!wrap) return;

    let seatIndex = 0;
    wrap.innerHTML = `<div class="theatre-layout">` +
      ROW_CONFIG.map(({ label, count }) => {
        const rowSeats = seats.slice(seatIndex, seatIndex + count);
        seatIndex += count;
        const half = Math.floor(count / 2);

        const seatBtns = rowSeats.map((seat, si) => {
          const gap = si === half ? `<div class="seat-gap"></div>` : "";
          if (seat.isbooked) {
            return `${gap}<div class="seat seat-booked" title="Booked by ${seat.name || 'someone'}"></div>`;
          }
          const sel = selectedIds.has(seat.id);
          return `${gap}<button class="seat ${sel ? "seat-selected" : "seat-available"}" data-id="${seat.id}" title="Seat ${seat.seat_no} · Row ${label}"></button>`;
        }).join("");

        return `
          <div class="theatre-row" data-row="${label}">
            <span class="row-label">${label}</span>
            <div class="row-seats">${seatBtns}</div>
            <span class="row-label">${label}</span>
          </div>`;
      }).join("") +
    `</div>`;

    wrap.querySelectorAll("button.seat").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        if (selectedIds.has(id)) {
          selectedIds.delete(id);
        } else {
          if (selectedIds.size >= MAX_SEATS) {
            const first = selectedIds.values().next().value;
            selectedIds.delete(first);
          }
          selectedIds.add(id);
        }
        updateBar();
        renderGrid();
      });
    });
  }

  function updateBar() {
    const bar = document.getElementById("booking-bar");
    const barSeats = document.getElementById("bar-seats");
    const barTotal = document.getElementById("bar-total");
    if (!bar) return;
    if (selectedIds.size === 0) {
      bar.classList.remove("visible");
    } else {
      bar.classList.add("visible");
      barSeats.textContent = [...selectedIds].map(id => {
        const s = seats.find(x => x.id === id);
        return s ? `${s.seat_no}` : id;
      }).join(", ");
      barTotal.textContent = `₹${selectedIds.size * movie.price}`;
    }
  }

  renderGrid();

  document.getElementById("bar-confirm").addEventListener("click", async () => {
    if (selectedIds.size === 0) return;
    if (!getToken()) {
      openModal(async () => openNameDialog());
      return;
    }
    openNameDialog();
  });

  function openNameDialog() {
    const ids = [...selectedIds];
    const dialog = document.getElementById("name-dialog");
    document.getElementById("name-dialog-sub").textContent =
      `${ids.length} seat${ids.length > 1 ? "s" : ""} · ${movie.title} · ${time}`;

    const fields = document.getElementById("name-fields");
    fields.innerHTML = ids.map((id, i) => {
      const seat = seats.find(s => s.id === id);
      return `
        <div style="margin-bottom:12px">
          <label style="font-size:0.75rem;color:var(--text3);text-transform:uppercase;letter-spacing:1px;font-weight:600;display:block;margin-bottom:6px">
            Seat ${seat?.seat_no ?? id} ${i === 0 ? "<span style='color:var(--pink)'>*</span>" : "(optional)"}
          </label>
          <input class="input" style="margin-bottom:0" id="name-input-${i}"
            placeholder="${i === 0 ? "Your name (required)" : "Guest name (optional)"}"
            ${i === 0 ? "required" : ""} />
        </div>`;
    }).join("");

    dialog.classList.remove("hidden");
    document.getElementById("name-input-0")?.focus();

    document.getElementById("name-dialog-confirm").onclick = async () => {
      const primaryName = document.getElementById("name-input-0").value.trim();
      if (!primaryName) {
        document.getElementById("name-input-0").focus();
        document.getElementById("name-input-0").style.borderColor = "var(--pink)";
        return;
      }
      const names = ids.map((_, i) => {
        const val = document.getElementById(`name-input-${i}`)?.value.trim();
        return val || primaryName;
      });
      dialog.classList.add("hidden");
      await confirmBooking(ids, names);
    };
  }

  document.getElementById("name-dialog-close").addEventListener("click", () => {
    document.getElementById("name-dialog").classList.add("hidden");
  });

  async function confirmBooking(ids, names) {
    try {
      const res = await fetch("/seats/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ seatIds: ids, names }),
      });

      if (res.status === 401) {
        clearToken(); updateUserBar();
        openModal(async () => openNameDialog());
        return;
      }

      const data = await res.json();
      if (!res.ok) { alert(data.error || "Booking failed."); return; }

      // Update local seat state
      ids.forEach(id => {
        const seat = seats.find(s => s.id === id);
        if (seat) seat.isbooked = 1;
      });

      selectedIds.clear();
      updateBar();
      renderGrid();
      showTicket(movie, time, data.seatNos, names[0]);
    } catch (ex) {
      alert("Error: " + ex.message);
    }
  }
}

// ── Ticket ────────────────────────────────────────────────────────
function showTicket(movie, time, seats, name) {
  document.getElementById("ticket-movie").textContent = movie.title;
  document.getElementById("ticket-time").textContent = time;
  document.getElementById("ticket-seats").textContent = seats.join(", ");
  document.getElementById("ticket-name").textContent = name;
  document.getElementById("ticket-amount").textContent = `₹${seats.length * movie.price}`;
  document.getElementById("ticket-overlay").classList.remove("hidden");
}

document.getElementById("ticket-close").addEventListener("click", () => {
  document.getElementById("ticket-overlay").classList.add("hidden");
});
document.getElementById("ticket-overlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) document.getElementById("ticket-overlay").classList.add("hidden");
});

// ── My Bookings Page ──────────────────────────────────────────────
async function renderBookingsPage() {
  if (!getToken()) { openModal(() => renderBookingsPage()); return; }
  showPage("bookings");
  const container = document.getElementById("page-bookings");
  container.innerHTML = `
    <div class="bookings-page">
      <button class="back-btn" id="bookings-back">← Back to movies</button>
      <div class="bookings-header">
        <h2>My <span>Bookings</span></h2>
        <p>Your confirmed tickets</p>
      </div>
      <div id="bookings-list" class="bookings-list">
        <div class="loading">Loading bookings</div>
      </div>
    </div>`;

  document.getElementById("bookings-back").addEventListener("click", renderMoviesPage);

  try {
    const res = await fetch("/bookings", {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (res.status === 401) { clearToken(); updateUserBar(); openModal(() => renderBookingsPage()); return; }
    const bookings = await res.json();
    const list = document.getElementById("bookings-list");

    if (!bookings.length) {
      list.innerHTML = `<div class="no-bookings">No bookings yet. Go grab some seats! 🍿</div>`;
      return;
    }

    list.innerHTML = bookings.map((b, i) => {
      const movie   = MOVIES.find(m => m.id === b.movie_id);
      const date    = new Date(b.booked_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
      const count   = b.seat_nos.length;

      // One card per seat
      const cards = b.seat_nos.map((seatNo, ci) => `
        <div class="deck-card" data-index="${ci}" data-total="${count}">
          <div class="bt-poster">
            <img src="${movie?.poster || ''}" alt="${movie?.title || ''}" />
          </div>
          <div class="bt-body">
            <div class="bt-tear"></div>
            <div class="bt-content">
              <div class="bt-movie">${movie?.title || 'Movie'}</div>
              <div class="bt-rows">
                <div class="bt-row"><span>Show</span><strong>${b.show_time}</strong></div>
                <div class="bt-row"><span>Seat</span><strong>#${seatNo}</strong></div>
                <div class="bt-row"><span>Name</span><strong>${b.names[ci] || b.names[0]}</strong></div>
                <div class="bt-row"><span>Date</span><strong>${date}</strong></div>
              </div>
              <div class="bt-barcode">||| || |||| ||| || ||||</div>
            </div>
          </div>
        </div>`).join("");

      return `
        <div class="booking-deck" data-open="false" style="animation-delay:${i * 0.1}s; --card-count:${count}">
          <div class="deck-hint">${count > 1 ? `${count} tickets · tap to expand` : "1 ticket"}</div>
          <div class="deck-cards">${cards}</div>
        </div>`;
    }).join("");

    // Wire click to toggle open/close
    list.querySelectorAll(".booking-deck").forEach(deck => {
      deck.addEventListener("click", () => {
        const isOpen = deck.dataset.open === "true";
        deck.dataset.open = isOpen ? "false" : "true";
        deck.querySelector(".deck-hint").textContent =
          isOpen
            ? `${deck.querySelectorAll(".deck-card").length} tickets · tap to expand`
            : "tap to collapse";
      });
    });
  } catch {
    document.getElementById("bookings-list").innerHTML = `<p style="color:#ff6b6b;text-align:center">Failed to load bookings.</p>`;
  }
}

// ── Event wiring ──────────────────────────────────────────────────
document.getElementById("nav-logo").addEventListener("click", renderMoviesPage);
document.getElementById("modal-close").addEventListener("click", closeModal);
document.getElementById("auth-modal").addEventListener("click", e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById("tab-login").addEventListener("click", () => switchTab("login"));
document.getElementById("tab-register").addEventListener("click", () => switchTab("register"));
document.getElementById("logout-btn").addEventListener("click", () => { clearToken(); updateUserBar(); renderMoviesPage(); });
document.getElementById("open-login-btn").addEventListener("click", () => openModal());
document.getElementById("my-bookings-btn").addEventListener("click", renderBookingsPage);

document.getElementById("auth-submit").addEventListener("click", async () => {
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  if (!email || !password) { showAuthError("Email and password are required."); return; }
  const btn = document.getElementById("auth-submit");
  btn.disabled = true; btn.textContent = "Please wait...";
  try {
    const token = activeTab === "login"
      ? await loginUser(email, password)
      : await registerUser(email, password);
    setToken(token); updateUserBar(); closeModal();
    if (pendingAction) await pendingAction();
  } catch (err) {
    showAuthError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = activeTab === "login" ? "Login" : "Register";
  }
});

document.getElementById("guest-btn").addEventListener("click", async () => {
  const btn = document.getElementById("guest-btn");
  btn.disabled = true; btn.textContent = "Signing in...";
  try {
    const token = await loginUser("guest@ticketbaazi.com", "Guest@1234");
    setToken(token); updateUserBar(); closeModal();
    if (pendingAction) await pendingAction();
  } catch {
    showAuthError("Guest login failed. Auto-seeded on server start — try restarting the server.");
  } finally {
    btn.disabled = false; btn.textContent = "👤 Continue as Guest";
  }
});

// ── Init ──────────────────────────────────────────────────────────
updateUserBar();
renderMoviesPage();
