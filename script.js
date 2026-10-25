
const activities = {
  bowling: {
    name: "Bowling",
    price: 25,
    maxGuests: 10,
    duration: "60 minutes",
    description:
      "Enjoy a premium bowling experience with friends and family. Perfect for friendly competitions and unforgettable moments.",
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1000&q=85"
  },

  vr: {
    name: "VR Experience",
    price: 35,
    maxGuests: 5,
    duration: "30 minutes",
    description:
      "Discover immersive virtual worlds and enjoy an exciting adventure powered by virtual reality technology.",
    image:
      "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=1000&q=85"
  },

  karting: {
    name: "Karting",
    price: 40,
    maxGuests: 10,
    duration: "20 minutes",
    description:
      "Experience speed, excitement, and competition on the track. Challenge your friends and enjoy the ultimate racing adventure.",
    image:
      "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=1000&q=85"
  }
};

// BOOKING ELEMENTS

const form = document.getElementById("bookingForm");
const activityInput = document.getElementById("activity");
const peopleInput = document.getElementById("people");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");

const summaryActivity = document.getElementById("summaryActivity");
const summaryPrice = document.getElementById("summaryPrice");
const summaryPeople = document.getElementById("summaryPeople");
const summaryDate = document.getElementById("summaryDate");
const totalPrice = document.getElementById("totalPrice");

const ticket = document.getElementById("ticket");
const ticketDetails = document.getElementById("ticketDetails");

// MODAL ELEMENTS

const modal = document.getElementById("activityModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalDuration = document.getElementById("modalDuration");
const modalGuests = document.getElementById("modalGuests");
const modalPrice = document.getElementById("modalPrice");
const modalImage = document.getElementById("modalImage");
const modalBook = document.getElementById("modalBook");
const closeModalButton = document.getElementById("closeModal");

let selectedModalActivity = null;
let previousFocus = null;

// DATE SETTINGS

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

dateInput.min = getToday();

// BOOKING SUMMARY

function updateSummary() {
  const activity = activities[activityInput.value];

  peopleInput.max = activity.maxGuests;

  const people = Number(peopleInput.value);

  const validPeople =
    Number.isInteger(people) &&
    people >= 1 &&
    people <= activity.maxGuests
      ? people
      : 0;

  const total = activity.price * validPeople;

  summaryActivity.textContent = activity.name;
  summaryPrice.textContent = activity.price + " GEL";
  summaryPeople.textContent = validPeople || "Invalid";
  summaryDate.textContent = dateInput.value || "Not Selected";
  totalPrice.textContent = total + " GEL";
}

activityInput.addEventListener("change", () => {
  const activity = activities[activityInput.value];

  if (Number(peopleInput.value) > activity.maxGuests) {
    peopleInput.value = activity.maxGuests;
  }

  updateSummary();
});

peopleInput.addEventListener("input", updateSummary);
dateInput.addEventListener("change", updateSummary);

// ACTIVITY MODAL

function openActivityModal(activityId) {
  const activity = activities[activityId];

  if (!activity || !modal) return;

  selectedModalActivity = activityId;
  previousFocus = document.activeElement;

  modalTitle.textContent = activity.name;
  modalDescription.textContent = activity.description;
  modalDuration.textContent = activity.duration;
  modalGuests.textContent = `1–${activity.maxGuests}`;
  modalPrice.textContent = activity.price + " GEL";
  modalImage.style.backgroundImage = `url("${activity.image}")`;

  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");

  closeModalButton.focus();
}

function closeActivityModal() {
  modal.classList.add("hidden");
  document.body.classList.remove("modal-open");

  if (previousFocus && typeof previousFocus.focus === "function") {
    previousFocus.focus();
  }
}

// OPEN MODAL FROM ACTIVITY BUTTONS

document.querySelectorAll(".choose-btn").forEach(button => {
  button.addEventListener("click", () => {
    openActivityModal(button.dataset.activity);
  });
});

// CLOSE MODAL

if (modal) {
  closeModalButton.addEventListener("click", closeActivityModal);

  modal.querySelector(".modal-overlay").addEventListener(
    "click",
    closeActivityModal
  );

  document.addEventListener("keydown", event => {
    if (modal.classList.contains("hidden")) return;

    if (event.key === "Escape") {
      closeActivityModal();
    }

    if (event.key === "Tab") {
      const focusable = [closeModalButton, modalBook];
      const currentIndex = focusable.indexOf(document.activeElement);

      if (event.shiftKey && currentIndex <= 0) {
        event.preventDefault();
        modalBook.focus();
      } else if (
        !event.shiftKey &&
        currentIndex >= focusable.length - 1
      ) {
        event.preventDefault();
        closeModalButton.focus();
      }
    }
  });

  modalBook.addEventListener("click", () => {
    if (!selectedModalActivity) return;

    activityInput.value = selectedModalActivity;

    const activity = activities[selectedModalActivity];

    if (Number(peopleInput.value) > activity.maxGuests) {
      peopleInput.value = activity.maxGuests;
    }

    updateSummary();
    closeActivityModal();

    document.getElementById("booking").scrollIntoView({
      behavior: "smooth"
    });
  });
}

// TICKET GENERATION

function createTicketNumber() {
  const randomNumber = Math.floor(
    100000 + Math.random() * 900000
  );

  return "PZ-" + Date.now() + "-" + randomNumber;
}

function addTicketLine(label, value) {
  const line = document.createElement("div");
  const strong = document.createElement("strong");

  strong.textContent = label + ": ";

  line.appendChild(strong);
  line.appendChild(document.createTextNode(String(value)));

  ticketDetails.appendChild(line);
}

// BOOKING SUBMISSION

form.addEventListener("submit", event => {
  event.preventDefault();

  dateInput.min = getToday();

  if (!form.reportValidity()) {
    return;
  }

  const activity = activities[activityInput.value];
  const people = Number(peopleInput.value);

  if (
    !Number.isInteger(people) ||
    people < 1 ||
    people > activity.maxGuests
  ) {
    alert(
      `Please select between 1 and ${activity.maxGuests} guests.`
    );
    return;
  }

  if (dateInput.value < getToday()) {
    alert("You cannot book a date in the past.");
    return;
  }

  const fullName = document
    .getElementById("fullName")
    .value.trim();

  const email = document
    .getElementById("email")
    .value.trim();

  if (!fullName) {
    alert("Please enter your full name.");
    return;
  }


  const remainingSeats = getRemainingSeats(
    activityInput.value,
    dateInput.value,
    timeInput.value
  );

  const currentTime = new Date().toTimeString().slice(0, 5);

  if (
    !timeInput.value ||
    (
      dateInput.value === getToday() &&
      timeInput.value <= currentTime
    )
  ) {
    alert("Please select an available time slot.");
    updateAvailability();
    return;
  }

  if (people > remainingSeats) {
    alert(
      `Only ${remainingSeats} seats are available for this time.`
    );

    updateAvailability();
    return;
  }


  const booking = {
    id: createTicketNumber(),
    name: fullName,
    email: email,
    activity: activity.name,
    date: dateInput.value,
    time: timeInput.value,
    people: people,
    total: activity.price * people
  };

  // SAVE DEMO BOOKING LOCALLY

  try {
    const savedBookings = JSON.parse(
      localStorage.getItem("playzoneBookings") || "[]"
    );

    if (Array.isArray(savedBookings)) {
      savedBookings.push(booking);

      localStorage.setItem(
        "playzoneBookings",
        JSON.stringify(savedBookings)
      );
    }
  } catch (error) {
    console.warn("Could not save booking locally.", error);
  }

  updateAvailability();

  // DISPLAY TICKET

  ticketDetails.replaceChildren();

  addTicketLine("Ticket Number", booking.id);
  addTicketLine("Guest Name", booking.name);
  addTicketLine("Email", booking.email);
  addTicketLine("Activity", booking.activity);
  addTicketLine("Date", booking.date);
  addTicketLine("Time", booking.time);
  addTicketLine("Guests", booking.people);
  addTicketLine("Total Price", booking.total + " GEL");

  ticket.classList.remove("hidden");

  ticket.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
});

// PRINT TICKET

document.getElementById("printTicket").addEventListener(
  "click",
  () => {
    window.print();
  }
);

// INITIALIZE

updateSummary();


// DEMO AVAILABILITY SYSTEM

function getSavedBookings() {
  try {
    const bookings = JSON.parse(
      localStorage.getItem("playzoneBookings") || "[]"
    );

    return Array.isArray(bookings) ? bookings : [];
  } catch (error) {
    console.warn("Could not load bookings.", error);
    return [];
  }
}

function getRemainingSeats(activityId, date, time) {
  const activity = activities[activityId];

  const matchingBookings = getSavedBookings().filter(booking => {
    return (
      booking.activity === activity.name &&
      booking.date === date &&
      booking.time === time
    );
  });

  const reservedSeats = matchingBookings.reduce((total, booking) => {
    return total + Number(booking.people || 0);
  }, 0);

  return Math.max(0, activity.maxGuests - reservedSeats);
}

function updateAvailability() {
  const activityId = activityInput.value;
  const selectedDate = dateInput.value;
  const requestedGuests = Number(peopleInput.value);

  const options = Array.from(timeInput.options);

  options.forEach(option => {
    const time = option.value;

    if (!selectedDate) {
      option.disabled = false;
      option.textContent = time;
      return;
    }

    const remaining = getRemainingSeats(
      activityId,
      selectedDate,
      time
    );

    const isPastTime =
      selectedDate === getToday() &&
      time <= new Date().toTimeString().slice(0, 5);

    const insufficientSeats =
      remaining === 0 ||
      (requestedGuests > 0 && requestedGuests > remaining);

    option.disabled = isPastTime || insufficientSeats;

    if (isPastTime) {
      option.textContent = time + " — Unavailable";
    } else if (remaining === 0) {
      option.textContent = time + " — Fully Booked";
    } else {
      option.textContent = time + ` — ${remaining} Seats Left`;
    }
  });

  if (timeInput.selectedOptions[0]?.disabled) {
    const firstAvailable = options.find(option => !option.disabled);
    timeInput.value = firstAvailable ? firstAvailable.value : "";
  }
}

activityInput.addEventListener("change", updateAvailability);
dateInput.addEventListener("change", updateAvailability);
peopleInput.addEventListener("input", updateAvailability);

updateAvailability();


// INTERACTIVE PHOTO GALLERY

const galleryItems = Array.from(
  document.querySelectorAll(".gallery-item")
);

const galleryLightbox = document.getElementById("galleryLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxCounter = document.getElementById("lightboxCounter");

const galleryClose = document.getElementById("galleryClose");
const galleryPrev = document.getElementById("galleryPrev");
const galleryNext = document.getElementById("galleryNext");

let currentGalleryIndex = 0;
let galleryPreviousFocus = null;

function showGalleryImage(index) {
  currentGalleryIndex =
    (index + galleryItems.length) % galleryItems.length;

  const item = galleryItems[currentGalleryIndex];
  const image = item.querySelector("img");

  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;

  lightboxCaption.textContent =
    item.querySelector(".gallery-caption strong").textContent;

  lightboxCounter.textContent =
    `${currentGalleryIndex + 1} / ${galleryItems.length}`;
}

function openGallery(index) {
  galleryPreviousFocus = document.activeElement;

  showGalleryImage(index);

  galleryLightbox.classList.remove("hidden");
  document.body.classList.add("gallery-open");

  galleryClose.focus();
}

function closeGallery() {
  galleryLightbox.classList.add("hidden");
  document.body.classList.remove("gallery-open");

  lightboxImage.removeAttribute("src");

  galleryPreviousFocus?.focus();
}

galleryItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    openGallery(index);
  });
});

galleryClose.addEventListener("click", closeGallery);

galleryPrev.addEventListener("click", () => {
  showGalleryImage(currentGalleryIndex - 1);
});

galleryNext.addEventListener("click", () => {
  showGalleryImage(currentGalleryIndex + 1);
});

galleryLightbox.addEventListener("click", event => {
  if (event.target === galleryLightbox) {
    closeGallery();
  }
});

document.addEventListener("keydown", event => {
  if (galleryLightbox.classList.contains("hidden")) {
    return;
  }

  if (event.key === "Escape") {
    closeGallery();
  }

  if (event.key === "ArrowRight") {
    showGalleryImage(currentGalleryIndex + 1);
  }

  if (event.key === "ArrowLeft") {
    showGalleryImage(currentGalleryIndex - 1);
  }

  if (event.key === "Tab") {
    const controls = [
      galleryClose,
      galleryPrev,
      galleryNext
    ];

    const index = controls.indexOf(document.activeElement);

    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      galleryNext.focus();
    } else if (
      !event.shiftKey &&
      index >= controls.length - 1
    ) {
      event.preventDefault();
      galleryClose.focus();
    }
  }
});
