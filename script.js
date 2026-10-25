"use strict";

const ACTIVITIES = {
  bowling: {
    name: "Bowling",
    price: 25,
    seats: 10,
    duration: "60 minutes",
    short: "A perfect game with your crew.",
    description:
      "Challenge your friends, own the lanes and make every strike count. A social classic with big energy.",
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1100&q=85",
    icon: "🎳"
  },

  vr: {
    name: "VR Experience",
    price: 35,
    seats: 5,
    duration: "30 minutes",
    short: "Step beyond reality.",
    description:
      "Enter immersive worlds and discover interactive adventures built for a whole new kind of escape.",
    image:
      "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=1100&q=85",
    icon: "🥽"
  },

  karting: {
    name: "Karting",
    price: 40,
    seats: 10,
    duration: "20 minutes",
    short: "Feel the rush of the race.",
    description:
      "Get behind the wheel, chase the finish line and discover your competitive side on the track.",
    image:
      "https://images.unsplash.com/photo-1560990817-2a0037ed1246?w=1100&q=85",
    icon: "🏎️"
  }
};

const TIMES = [
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00"
];

const OFFERS = [
  {
    title: "First Play",
    icon: "✦",
    code: "PLAY10",
    rate: 0.10,
    min: 1,
    text: "Take 10% off your first PLAYZONE adventure."
  },
  {
    title: "Squad Goals",
    icon: "⚡",
    code: "GROUP15",
    rate: 0.15,
    min: 5,
    text: "Bring five or more people and save 15% together.",
    featured: true
  },
  {
    title: "Birthday Energy",
    icon: "🎂",
    code: "BDAY20",
    rate: 0.20,
    min: 4,
    text: "Celebrate with four or more guests for 20% off."
  }
];

const GALLERY = [
  {
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1400&q=85",
    title: "Where the magic happens"
  },
  {
    image: ACTIVITIES.vr.image,
    title: "Explore new worlds"
  },
  {
    image:
      "https://images.unsplash.com/photo-1580617971627-cffa74e39d1d?w=1400&q=85",
    title: "Make every moment count"
  }
];

const EVENTS = [
  {
    type: "WEEKLY EXPERIENCE",
    name: "Strike Night",
    text: "Bring your squad for an unforgettable bowling battle.",
    activity: "bowling"
  },
  {
    type: "IMMERSIVE SESSION",
    name: "Beyond Reality",
    text: "A whole new way to get lost in another world.",
    activity: "vr"
  },
  {
    type: "RACE CHALLENGE",
    name: "Fast Lane",
    text: "Ready, set, race. Feel the competition come alive.",
    activity: "karting"
  }
];

// DOM REFERENCES

const $ = id => document.getElementById(id);

const refs = {
  form: $("bookingForm"),
  activity: $("activity"),
  people: $("people"),
  date: $("date"),
  time: $("time"),
  promo: $("promo"),
  modal: $("activityModal"),
  gallery: $("galleryLightbox"),
  payment: $("paymentModal"),
  ticket: $("ticket")
};

let selectedActivity = "bowling";
let galleryIndex = 0;
let activeDiscount = "";
let pendingCheckout = null;
let lastTicketId = "";
let focusBeforeDialog = null;
let toastTimer;

// On mobile in-app browsers, muted autoplay can still be blocked.
// Expose native controls only when a tap is required, and remove them
// again when playback starts so the video stays visually clean.
function initializeHeroPlayback() {
  const video = document.querySelector(".hero-video");
  if (!video) return;

  function tryPlay() {
    if (document.hidden) return;

    try {
      const playback = video.play();

      if (playback && typeof playback.catch === "function") {
        playback.catch(() => {
          video.controls = true;
        });
      }
    } catch {
      video.controls = true;
    }
  }

  video.addEventListener("playing", () => {
    video.controls = false;
  });

  video.addEventListener("pause", () => {
    if (!document.hidden) video.controls = true;
  });

  video.addEventListener("click", () => {
    if (video.paused) tryPlay();
  });

  video.addEventListener("error", () => {
    video.style.display = "none"; // Keep the background image as fallback.
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && video.paused) tryPlay();
  });

  tryPlay();
}

initializeHeroPlayback();

// HELPERS

const escapeHtml = value =>
  String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const money = amount =>
  `${amount.toFixed(2).replace(/\.00$/, "")} GEL`;

function today() {
  const now = new Date();

  return (
    `${now.getFullYear()}-` +
    `${String(now.getMonth() + 1).padStart(2, "0")}-` +
    `${String(now.getDate()).padStart(2, "0")}`
  );
}

// LOCAL STORAGE

function bookings() {
  try {
    const value = JSON.parse(
      localStorage.getItem("playzone_portfolio_bookings") || "[]"
    );

    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveBookings(items) {
  try {
    localStorage.setItem(
      "playzone_portfolio_bookings",
      JSON.stringify(items)
    );

    return true;
  } catch {
    return false;
  }
}

// NOTIFICATIONS

function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 4500);
}

// MODAL MANAGEMENT

function openDialog(element) {
  focusBeforeDialog = document.activeElement;

  element.classList.remove("hidden");
  document.body.classList.add("locked");

  element.querySelector("button")?.focus();
}

function closeDialog(element) {
  element.classList.add("hidden");
  document.body.classList.remove("locked");

  focusBeforeDialog?.focus?.();
}

function trapFocus(event, overlay) {
  if (event.key !== "Tab") return;

  const items = [
    ...overlay.querySelectorAll(
      "button, input:not([disabled])"
    )
  ].filter(element => element.getClientRects().length);

  if (!items.length) return;

  const first = items[0];
  const last = items.at(-1);

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    document.activeElement === last
  ) {
    event.preventDefault();
    first.focus();
  }
}

// RENDER ACTIVITIES, OFFERS, GALLERY AND EVENTS

function renderCatalog() {
  $("experienceCards").innerHTML = Object.entries(ACTIVITIES)
    .map(([id, item]) => `
      <article class="experience-card">
        <div class="experience-photo">
          <img
            src="${item.image}"
            alt="${escapeHtml(item.name)} experience"
            loading="lazy"
          >
          <span>${item.duration}</span>
        </div>

        <div class="experience-content">
          <h3>${item.name}</h3>
          <p>${item.description}</p>

          <div class="experience-footer">
            <div>
              <strong>${money(item.price)}</strong>
              <small>per guest</small>
            </div>

            <button
              class="round-arrow"
              type="button"
              data-details="${id}"
              aria-label="View ${item.name} details"
            >
              ↗
            </button>
          </div>
        </div>
      </article>
    `)
    .join("");

  $("offerCards").innerHTML = OFFERS
    .map(offer => `
      <article class="offer-card ${offer.featured ? "featured" : ""}">
        <span class="offer-icon">${offer.icon}</span>

        <h3>${offer.title}</h3>
        <p>${offer.text}</p>

        <div class="offer-code">
          CODE: ${offer.code}
        </div>

        <button type="button" data-offer="${offer.code}">
          Apply offer ↗
        </button>
      </article>
    `)
    .join("");

  $("galleryGrid").innerHTML = GALLERY
    .map((photo, index) => `
      <button
        class="gallery-tile"
        type="button"
        data-image="${index}"
        aria-label="View photo ${index + 1}: ${escapeHtml(photo.title)}"
      >
        <img
          src="${photo.image}"
          alt="${escapeHtml(photo.title)}"
          loading="lazy"
        >

        <span class="gallery-caption">
          ${escapeHtml(photo.title)}
        </span>
      </button>
    `)
    .join("");

  $("eventCards").innerHTML = EVENTS
    .map(item => `
      <article class="event-card">
        <div class="event-meta">${item.type}</div>

        <h3>${item.name}</h3>
        <p>${item.text}</p>

        <button type="button" data-event="${item.activity}">
          Explore experience ↗
        </button>
      </article>
    `)
    .join("");

  refs.activity.innerHTML = Object.entries(ACTIVITIES)
    .map(([id, item]) => `
      <option value="${id}">
        ${item.name} — ${money(item.price)}
      </option>
    `)
    .join("");

  refs.time.innerHTML = TIMES
    .map(time => `
      <option value="${time}">${time}</option>
    `)
    .join("");
}

// ACTIVITY DETAILS

function showActivity(id) {
  const item = ACTIVITIES[id];

  if (!item) return;

  selectedActivity = id;

  $("modalImage").replaceChildren(
    Object.assign(document.createElement("img"), {
      src: item.image,
      alt: item.name
    })
  );

  $("modalTitle").textContent = item.name;
  $("modalDescription").textContent = item.description;
  $("modalDuration").textContent = item.duration;
  $("modalGuests").textContent = `1–${item.seats}`;
  $("modalPrice").textContent = money(item.price);

  openDialog(refs.modal);
}

function selectExperience(id) {
  refs.activity.value = id;

  const max = ACTIVITIES[id].seats;

  refs.people.max = max;

  if (+refs.people.value > max) {
    refs.people.value = max;
  }

  updateAvailability();
  updateSummary();

  document.querySelector("#booking").scrollIntoView({
    behavior: "smooth"
  });
}

// SIMULATED AVAILABILITY

function remainingSeats(id, date, time) {
  const reserved = bookings()
    .filter(booking =>
      booking.status === "paid-simulation" &&
      booking.activityId === id &&
      booking.date === date &&
      booking.time === time
    )
    .reduce(
      (sum, booking) => sum + Number(booking.guests || 0),
      0
    );

  return Math.max(0, ACTIVITIES[id].seats - reserved);
}

function updateAvailability() {
  refs.people.max = ACTIVITIES[refs.activity.value].seats;

  const selected = refs.time.value;
  const date = refs.date.value;
  const count = +refs.people.value;
  const clock = new Date().toTimeString().slice(0, 5);

  let availableCount = 0;

  for (const option of refs.time.options) {
    const remaining = date
      ? remainingSeats(
          refs.activity.value,
          date,
          option.value
        )
      : ACTIVITIES[refs.activity.value].seats;

    const past =
      date === today() &&
      option.value <= clock;

    const closed =
      Boolean(date) &&
      (
        date < today() ||
        past ||
        remaining < count
      );

    option.disabled = closed;

    if (!closed) {
      availableCount++;
    }

    option.textContent = date
      ? `${option.value} — ${
          past
            ? "Unavailable"
            : remaining === 0
              ? "Fully booked"
              : `${remaining} seats left`
        }`
      : option.value;
  }

  if (
    refs.time.selectedOptions[0]?.disabled ||
    !refs.time.value
  ) {
    refs.time.value =
      [...refs.time.options]
        .find(option => !option.disabled)?.value || "";
  }

  $("availabilityMessage").textContent = !date
    ? "Select a date to see available sessions."
    : availableCount
      ? "Availability shown for this browser's simulated bookings."
      : "No suitable sessions available for this date and group size.";

  $("availabilityMessage").classList.toggle(
    "error",
    !!date && !availableCount
  );

  if (selected !== refs.time.value) {
    updateSummary();
  }
}

// DISCOUNTS

function discountInfo(guests) {
  const offer = OFFERS.find(
    item => item.code === activeDiscount
  );

  return offer && guests >= offer.min
    ? offer
    : null;
}

function calculation() {
  const item = ACTIVITIES[refs.activity.value];

  const guests = Math.max(
    0,
    Number.isInteger(+refs.people.value)
      ? +refs.people.value
      : 0
  );

  const subtotal = item.price * guests;
  const offer = discountInfo(guests);

  const discount = offer
    ? Math.round(subtotal * offer.rate * 100) / 100
    : 0;

  return {
    item,
    guests,
    subtotal,
    discount,
    total: subtotal - discount,
    offer
  };
}

// BOOKING SUMMARY

function updateSummary() {
  const result = calculation();

  $("summaryActivity").textContent = result.item.name;
  $("summaryDescription").textContent = result.item.short;
  $("summaryPrice").textContent = money(result.item.price);
  $("summaryPeople").textContent = String(result.guests);

  $("summaryDate").textContent =
    refs.date.value || "Not selected";

  $("summaryTime").textContent =
    refs.time.value || "Not selected";

  $("summaryDiscount").textContent =
    `− ${money(result.discount)}`;

  $("totalPrice").textContent = money(result.total);
}

// PROMO CODES

function applyPromo(code) {
  const normalized = code.trim().toUpperCase();

  const offer = OFFERS.find(
    item => item.code === normalized
  );

  const message = $("promoMessage");

  if (!normalized) {
    activeDiscount = "";
    message.textContent = "";
    message.className = "field-note";

    updateSummary();
    return;
  }

  if (!offer) {
    activeDiscount = "";
    message.textContent = "Promo code not recognized.";
    message.className = "field-note error";

    updateSummary();
    return;
  }

  if (+refs.people.value < offer.min) {
    activeDiscount = "";

    message.textContent =
      `${offer.code} requires at least ${offer.min} guests.`;

    message.className = "field-note error";

    updateSummary();
    return;
  }

  activeDiscount = normalized;
  refs.promo.value = normalized;

  message.textContent =
    `${Math.round(offer.rate * 100)}% discount applied!`;

  message.className = "field-note success";

  updateSummary();
}

// CHECKOUT

function startCheckout(event) {
  event.preventDefault();

  refs.date.min = today();

  if (!refs.form.reportValidity()) {
    return;
  }

  let result = calculation();

  if (
    result.guests < 1 ||
    result.guests > result.item.seats
  ) {
    showToast("Select a valid number of guests.");
    return;
  }

  if (
    !refs.date.value ||
    refs.date.value < today() ||
    !refs.time.value
  ) {
    showToast("Select an available date and time.");
    return;
  }

  if (
    refs.date.value === today() &&
    refs.time.value <= new Date().toTimeString().slice(0, 5)
  ) {
    showToast("This session has already started.");
    return;
  }

  if (
    remainingSeats(
      refs.activity.value,
      refs.date.value,
      refs.time.value
    ) < result.guests
  ) {
    showToast("Not enough seats in this time slot.");

    updateAvailability();
    return;
  }

  const normalized = refs.promo.value
    .trim()
    .toUpperCase();

  if (!normalized && activeDiscount) {
    applyPromo("");
    result = calculation();
  }

  if (normalized && normalized !== activeDiscount) {
    applyPromo(normalized);

    if (activeDiscount !== normalized) {
      return;
    }

    result = calculation();
  }

  pendingCheckout = {
    activityId: refs.activity.value,
    name: $("fullName").value.trim(),
    email: $("email").value.trim(),
    date: refs.date.value,
    time: refs.time.value,
    guests: result.guests,
    discount: result.discount,
    total: result.total,
    promo: result.offer?.code || ""
  };

  if (!pendingCheckout.name) {
    showToast("Please enter your name.");
    return;
  }

  $("paymentDescription").textContent =
    `${result.item.name} · ` +
    `${result.guests} guest${result.guests === 1 ? "" : "s"} · ` +
    `${refs.date.value} at ${refs.time.value}`;

  $("paymentTotal").textContent = money(result.total);

  openDialog(refs.payment);
}

// SIMULATED PAYMENT

function finishPayment(succeeded) {
  if (!pendingCheckout) {
    return;
  }

  if (!succeeded) {
    pendingCheckout = null;

    closeDialog(refs.payment);

    showToast(
      "Payment simulation failed. Nothing was booked or charged."
    );

    return;
  }

  if (
    remainingSeats(
      pendingCheckout.activityId,
      pendingCheckout.date,
      pendingCheckout.time
    ) < pendingCheckout.guests
  ) {
    closeDialog(refs.payment);

    pendingCheckout = null;

    updateAvailability();

    showToast(
      "This session filled up. Please select another time."
    );

    return;
  }

  const record = {
    id: `PZ-${
      crypto.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }`,

    activityId: pendingCheckout.activityId,
    date: pendingCheckout.date,
    time: pendingCheckout.time,
    guests: pendingCheckout.guests,
    discount: pendingCheckout.discount,
    total: pendingCheckout.total,
    status: "paid-simulation",
    createdAt: new Date().toISOString()
  };

  const next = [...bookings(), record];

  if (!saveBookings(next)) {
    closeDialog(refs.payment);

    showToast(
      "Could not save the booking. Check browser storage."
    );

    return;
  }

  lastTicketId = record.id;

  renderTicket(
    record,
    pendingCheckout.name,
    pendingCheckout.email
  );

  pendingCheckout = null;

  closeDialog(refs.payment);

  renderBookingHistory();
  updateAvailability();
  updateSummary();

  refs.ticket.classList.remove("hidden");

  refs.ticket.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  showToast(
    "Successful payment simulated. Portfolio ticket ready!"
  );
}

// ELECTRONIC TICKET

function renderTicket(record, name, email) {
  const detail = $("ticketDetails");

  detail.replaceChildren();

  const qr = $("ticketQr");

  qr.replaceChildren();

  if (typeof window.QRCode === "function") {
    new window.QRCode(qr, {
      text: record.id,
      width: 118,
      height: 118,
      colorDark: "#101525",
      colorLight: "#ffffff"
    });
  } else {
    qr.textContent = `QR reference: ${record.id}`;
  }

  const rows = [
    ["Reference", record.id],
    ["Guest", name],
    ["Email", email],
    ["Experience", ACTIVITIES[record.activityId].name],
    ["Date", record.date],
    ["Time", record.time],
    ["Guests", record.guests],
    ["Total", money(record.total)],
    ["Payment", "Simulated (no charge)"]
  ];

  rows.forEach(([key, value]) => {
    const div = document.createElement("div");

    const label = document.createElement("span");
    const strong = document.createElement("strong");

    label.textContent = key;
    strong.textContent = String(value);

    div.append(label, strong);

    detail.append(div);
  });
}

// BOOKING HISTORY

function renderBookingHistory() {
  const root = $("bookingHistory");

  const records = bookings()
    .slice()
    .reverse();

  if (!records.length) {
    root.innerHTML = `
      <div class="empty-state">
        No bookings yet. Your completed checkout
        simulations will appear here.
      </div>
    `;

    return;
  }

  root.innerHTML = records
    .map(record => `
      <article class="history-card">
        <div class="history-meta">
          <strong>
            ${escapeHtml(
              ACTIVITIES[record.activityId]?.name || "Experience"
            )}
          </strong>

          <span class="pill">
            ${
              record.status === "cancelled"
                ? "Cancelled"
                : "Simulated"
            }
          </span>
        </div>

        <p>
          ${escapeHtml(record.date)} ·
          ${escapeHtml(record.time)} ·
          ${Number(record.guests)} guests
        </p>

        <p>
          ${money(Number(record.total))} ·
          ${escapeHtml(record.id)}
        </p>

        ${
          record.status !== "cancelled"
            ? `
              <button
                type="button"
                data-cancel="${escapeHtml(record.id)}"
              >
                Cancel simulation
              </button>
            `
            : ""
        }
      </article>
    `)
    .join("");
}

// CSV EXPORT

function exportCsv() {
  const data = bookings();

  if (!data.length) {
    showToast("Nothing to export yet.");
    return;
  }

  const columns = [
    "id",
    "activityId",
    "date",
    "time",
    "guests",
    "discount",
    "total",
    "status",
    "createdAt"
  ];

  const safe = value =>
    `"${String(value ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replace(/"/g, '""')}"`;

  const csv = [
    columns.join(","),
    ...data.map(record =>
      columns
        .map(column => safe(record[column]))
        .join(",")
    )
  ].join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], {
      type: "text/csv;charset=utf-8"
    })
  );

  const link = document.createElement("a");

  link.href = url;
  link.download = "playzone-bookings.csv";
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

// INITIALIZATION

renderCatalog();

refs.date.min = today();
refs.activity.value = "bowling";

renderBookingHistory();
updateAvailability();
updateSummary();

// MOBILE MENU

$("menuButton").addEventListener("click", () => {
  const open = $("primaryNav").classList.toggle("open");

  $("menuButton").setAttribute(
    "aria-expanded",
    String(open)
  );
});

$("primaryNav").addEventListener("click", event => {
  if (!event.target.closest("a")) {
    return;
  }

  $("primaryNav").classList.remove("open");

  $("menuButton").setAttribute(
    "aria-expanded",
    "false"
  );
});

// EXPERIENCE BUTTONS

$("experienceCards").addEventListener("click", event => {
  const id = event.target
    .closest("[data-details]")
    ?.dataset.details;

  if (id) {
    showActivity(id);
  }
});

// OFFER BUTTONS

$("offerCards").addEventListener("click", event => {
  const code = event.target
    .closest("[data-offer]")
    ?.dataset.offer;

  if (!code) {
    return;
  }

  const offer = OFFERS.find(item => item.code === code);

  if (+refs.people.value < (offer?.min || 1)) {
    refs.people.value = offer.min;
  }

  refs.promo.value = code;

  updateAvailability();
  applyPromo(code);

  $("booking").scrollIntoView({
    behavior: "smooth"
  });
});

// EVENT BUTTONS

$("eventCards").addEventListener("click", event => {
  const id = event.target
    .closest("[data-event]")
    ?.dataset.event;

  if (id) {
    selectExperience(id);
  }
});

// ACTIVITY MODAL EVENTS

$("modalBook").addEventListener("click", () => {
  closeDialog(refs.modal);
  selectExperience(selectedActivity);
});

$("closeModal").addEventListener("click", () => {
  closeDialog(refs.modal);
});

refs.modal.addEventListener("click", event => {
  if (event.target === refs.modal) {
    closeDialog(refs.modal);
  }
});

// GALLERY

function showGallery(index) {
  galleryIndex =
    (index + GALLERY.length) % GALLERY.length;

  $("lightboxImage").src =
    GALLERY[galleryIndex].image;

  $("lightboxImage").alt =
    GALLERY[galleryIndex].title;

  $("lightboxCaption").textContent =
    GALLERY[galleryIndex].title;

  $("lightboxCounter").textContent =
    `${galleryIndex + 1} / ${GALLERY.length}`;
}

$("galleryGrid").addEventListener("click", event => {
  const index = event.target
    .closest("[data-image]")
    ?.dataset.image;

  if (index === undefined) {
    return;
  }

  showGallery(+index);
  openDialog(refs.gallery);
});

$("galleryPrev").addEventListener("click", () => {
  showGallery(galleryIndex - 1);
});

$("galleryNext").addEventListener("click", () => {
  showGallery(galleryIndex + 1);
});

$("galleryClose").addEventListener("click", () => {
  closeDialog(refs.gallery);
});

refs.gallery.addEventListener("click", event => {
  if (event.target === refs.gallery) {
    closeDialog(refs.gallery);
  }
});

// BOOKING FORM EVENTS

refs.activity.addEventListener("change", () => {
  if (
    +refs.people.value >
    ACTIVITIES[refs.activity.value].seats
  ) {
    refs.people.value =
      ACTIVITIES[refs.activity.value].seats;
  }

  activeDiscount = "";
  refs.promo.value = "";

  $("promoMessage").textContent = "";

  updateAvailability();
  updateSummary();
});

refs.date.addEventListener("change", () => {
  updateAvailability();
  updateSummary();
});

refs.time.addEventListener(
  "change",
  updateSummary
);

refs.people.addEventListener("input", () => {
  updateAvailability();
  updateSummary();

  if (
    activeDiscount &&
    !discountInfo(+refs.people.value)
  ) {
    applyPromo(activeDiscount);
  }
});

// PROMO EVENTS

$("applyPromo").addEventListener("click", () => {
  applyPromo(refs.promo.value);
});

refs.promo.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyPromo(refs.promo.value);
  }
});

// CHECKOUT EVENTS

refs.form.addEventListener(
  "submit",
  startCheckout
);

$("paymentClose").addEventListener("click", () => {
  pendingCheckout = null;
  closeDialog(refs.payment);
});

$("paymentSuccess").addEventListener("click", () => {
  finishPayment(true);
});

$("paymentFail").addEventListener("click", () => {
  finishPayment(false);
});

// CANCEL BOOKING

$("bookingHistory").addEventListener("click", event => {
  const id = event.target
    .closest("[data-cancel]")
    ?.dataset.cancel;

  if (!id) {
    return;
  }

  const next = bookings().map(record =>
    record.id === id
      ? { ...record, status: "cancelled" }
      : record
  );

  if (saveBookings(next)) {
    renderBookingHistory();
    updateAvailability();

    showToast("Simulation cancelled.");
  } else {
    showToast("Could not update browser storage.");
  }
});

// COPY TICKET

$("copyTicket").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(lastTicketId);

    showToast("Reference copied!");
  } catch {
    showToast(`Ticket reference: ${lastTicketId}`);
  }
});

// PRINT TICKET

$("printTicket").addEventListener("click", () => {
  window.print();
});

// EXPORT BOOKINGS

$("exportBookings").addEventListener(
  "click",
  exportCsv
);

// KEYBOARD CONTROLS

document.addEventListener("keydown", event => {
  const active = [
    refs.payment,
    refs.gallery,
    refs.modal
  ].find(element =>
    !element.classList.contains("hidden")
  );

  if (!active) {
    return;
  }

  if (event.key === "Escape") {
    if (active === refs.payment) {
      pendingCheckout = null;
    }

    closeDialog(active);
    return;
  }

  if (
    active === refs.gallery &&
    event.key === "ArrowLeft"
  ) {
    showGallery(galleryIndex - 1);
  }

  if (
    active === refs.gallery &&
    event.key === "ArrowRight"
  ) {
    showGallery(galleryIndex + 1);
  }

  trapFocus(event, active);
});

// INTERACTIVE 3D EXPERIENCE CARDS

function initialize3DCards() {
  const cards = document.querySelectorAll(".experience-card");

  const canHover = window.matchMedia("(hover: hover)").matches;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!canHover || reducedMotion) return;

  cards.forEach(card => {
    card.addEventListener("pointermove", event => {
      const rect = card.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateY = ((x - centerX) / centerX) * 6;
      const rotateX = -((y - centerY) / centerY) * 6;

      card.style.transform =
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

      card.style.setProperty(
        "--mouse-x",
        `${(x / rect.width) * 100}%`
      );

      card.style.setProperty(
        "--mouse-y",
        `${(y / rect.height) * 100}%`
      );
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    });
  });
}

initialize3DCards();

// SCROLL REVEAL ANIMATIONS

function initializeScrollAnimations() {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reducedMotion || !("IntersectionObserver" in window)) {
    return;
  }

  const elements = document.querySelectorAll(`
    .section-heading,
    .experience-card,
    .offer-card,
    .gallery-tile,
    .event-card,
    .booking-form,
    .booking-summary,
    .faq-list,
    .admin-note
  `);

  elements.forEach(element => {
    element.classList.add("reveal-item");
  });

  const observer = new IntersectionObserver(
    (entries, observerInstance) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observerInstance.unobserve(entry.target);
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -30px 0px"
    }
  );

  document.documentElement.classList.add("reveal-ready");

  elements.forEach(element => {
    observer.observe(element);
  });
}

initializeScrollAnimations();

// PREMIUM TIME SLOT PICKER

function initializeTimeSlots() {
  const container = document.getElementById("timeSlots");
  const select = document.getElementById("time");

  if (!container || !select) return;

  const originalLabel = select.closest("label");

  function renderTimeSlots() {
    const options = [...select.options];

    container.replaceChildren();

    options.forEach(option => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "time-slot";
      button.disabled = option.disabled;

      const selected = option.value === select.value;

      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));

      const time = document.createElement("strong");
      time.textContent = option.value;

      const availability = document.createElement("small");

      availability.textContent = option.disabled
        ? "Unavailable"
        : option.textContent.includes("—")
          ? option.textContent.split("—").slice(1).join("—").trim()
          : "Available";

      button.append(time, availability);

      button.addEventListener("click", () => {
        select.value = option.value;

        select.dispatchEvent(
          new Event("change", { bubbles: true })
        );

        renderTimeSlots();
      });

      container.appendChild(button);
    });
  }

  const observer = new MutationObserver(() => {
    renderTimeSlots();
  });

  observer.observe(select, {
    attributes: true,
    attributeFilter: ["disabled"],
    childList: true,
    characterData: true,
    subtree: true
  });

  select.addEventListener("change", renderTimeSlots);

  renderTimeSlots();

  if (originalLabel) {
    originalLabel.classList.add("original-time-field");
  }

  document.documentElement.classList.add("time-picker-enhanced");
}

initializeTimeSlots();

// PREMIUM BOOKING CALENDAR

function initializePremiumCalendar() {
  const dateInput = document.getElementById("date");
  const daysContainer = document.getElementById("calendarDays");
  const monthTitle = document.getElementById("calendarMonth");
  const selectedLabel = document.getElementById("calendarSelected");
  const previousButton = document.getElementById("calendarPrev");
  const nextButton = document.getElementById("calendarNext");

  if (
    !dateInput ||
    !daysContainer ||
    !monthTitle ||
    !selectedLabel ||
    !previousButton ||
    !nextButton
  ) {
    return;
  }

  const originalLabel = dateInput.closest("label");

  let currentMonth = new Date();
  currentMonth.setDate(1);

  function formatDate(year, month, day) {
    return (
      `${year}-` +
      `${String(month + 1).padStart(2, "0")}-` +
      `${String(day).padStart(2, "0")}`
    );
  }

  function renderCalendar() {
    daysContainer.replaceChildren();

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const todayString = today();

    monthTitle.textContent = firstDay.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric"
      }
    );

    const startingDay = (firstDay.getDay() + 6) % 7;

    for (let i = 0; i < startingDay; i++) {
      const empty = document.createElement("span");
      empty.className = "calendar-empty";
      daysContainer.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDate(year, month, day);

      const button = document.createElement("button");

      button.type = "button";
      button.className = "calendar-day";
      button.textContent = day;
      button.disabled = dateString < todayString;

      button.setAttribute(
        "aria-label",
        new Date(year, month, day).toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
          }
        )
      );

      if (dateString === todayString) {
        button.classList.add("today");
      }

      if (dateString === dateInput.value) {
        button.classList.add("selected");
        button.setAttribute("aria-pressed", "true");
      } else {
        button.setAttribute("aria-pressed", "false");
      }

      button.addEventListener("click", () => {
        dateInput.value = dateString;

        dateInput.dispatchEvent(
          new Event("change", { bubbles: true })
        );

        renderCalendar();
      });

      daysContainer.appendChild(button);
    }

    const currentMonthKey = formatDate(year, month, 1);
    const todayMonthKey = todayString.slice(0, 7) + "-01";

    previousButton.disabled = currentMonthKey <= todayMonthKey;

    selectedLabel.textContent = dateInput.value
      ? new Date(`${dateInput.value}T12:00:00`).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric"
          }
        )
      : "No date selected";
  }

  previousButton.addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
  });

  nextButton.addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
  });

  dateInput.addEventListener("change", () => {
    if (dateInput.value) {
      const [year, month] = dateInput.value
        .split("-")
        .map(Number);

      currentMonth = new Date(year, month - 1, 1);
    }

    renderCalendar();
  });

  renderCalendar();

  if (originalLabel) {
    originalLabel.classList.add("original-date-field");
  }

  document.documentElement.classList.add("calendar-enhanced");
}

initializePremiumCalendar();
