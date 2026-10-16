"use strict";

import {
  getLocalDateString,
  fullDateFormatter,
  clockFormatter,
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
