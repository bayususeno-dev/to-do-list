"use strict";

const STORAGE_KEYS = {
  profile: "todoProfile",
  tasks: "todoTasks",
};

import {
  getLocalDateString,
  fullDateFormatter,
  clockFormatter,
  readStorage,
  saveStorage,
} from "./date-reus.js";

/* ========================================
   1. CURRENT DATE & LIVE CLOCK
======================================== */

const currentDateElement = document.getElementById("current-date");
const liveClockElement = document.getElementById("live-clock");

function updateClock() {
  const now = new Date();

  currentDateElement.textContent = fullDateFormatter.format(now);
  currentDateElement.dateTime = getLocalDateString(now);

  liveClockElement.textContent = clockFormatter.format(now);
  liveClockElement.dateTime = now.toISOString();
}

updateClock();

// Refresh the clock every second.
setInterval(updateClock, 1000);

/* ========================================
   2. PROFILE
======================================== */

function loadProfile() {
  const savedProfile = readStorage(STORAGE_KEYS.profile, null);

  if (
    !savedProfile ||
    typeof savedProfile.name !== "string" ||
    typeof savedProfile.division !== "string"
  ) {
    return null;
  }

  return {
    name: savedProfile.name,
    division: savedProfile.division,
  };
}

let profile = loadProfile();

function renderProfile() {
  const profileDisplayName = document.getElementById("profile-display-name");
  const profileDisplayDivision = document.getElementById(
    "profile-display-division",
  );

  if (!profile) {
    profileDisplayName.textContent = "Profile not set";

    profileDisplayDivision.textContent =
      "Add your name and division or position.";

    return;
  }

  profileDisplayName.textContent = profile.name;
  profileDisplayDivision.textContent = profile.division;

  // Fill the inputs so the user can edit the saved profile.
  document.getElementById("profile-name").value = profile.name;
  document.getElementById("profile-division").value = profile.division;

  // Collapse the form when a saved profile already exists.
  document.getElementById("profile-settings").open = false;
}

document.getElementById("profile-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const profileNameInput = document.getElementById("profile-name");
  const profileDivisionInput = document.getElementById("profile-division");
  const profileMessage = document.getElementById("profile-message");

  const name = profileNameInput.value.trim();
  const division = profileDivisionInput.value.trim();

  if (!name || !division) {
    profileMessage.textContent =
      "Please enter both your name and division/position.";

    return;
  }

  const newProfile = {
    name,
    division,
  };

  const savedSuccessfully = saveStorage(STORAGE_KEYS.profile, newProfile);

  profile = newProfile;

  renderProfile();

  profileMessage.textContent = savedSuccessfully
    ? "Profile saved successfully."
    : "Profile updated for this session, but could not be saved in the browser.";
});
