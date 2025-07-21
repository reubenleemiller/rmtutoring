import { authHandler } from "../scripts/auth.js";

const VIDEO_API_URL = "https://expressjs-production-bc5b.up.railway.app";
//todo: import from railway instead

function formatDate(isoString) {
  const date = new Date(isoString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}


function createVideoTag(width, height, src) {
  const parent = document.getElementById("user-videos");
  const videoElement = document.createElement("video");
  videoElement.width = String(width);
  videoElement.width = String(height);
  videoElement.controls = true;
  videoElement.src = src;
  videoElement.className = "video-item";
  parent.appendChild(videoElement);
}

function createTD(booking) {

  // todo: wth is this function? refactor
  const tbody = document.querySelector("#schedule-table tbody");
  const tr = document.createElement("tr");
  const descTD = document.createElement("td");
  descTD.innerText = booking.title;
  tr.appendChild(descTD);
  const startTD = document.createElement("td");
  startTD.innerText = formatDate(booking.startTime);
  tr.appendChild(startTD);
  const endTD = document.createElement("td");
  endTD.innerText = formatDate(booking.endTime);
  tr.appendChild(endTD);
  const statusTD = document.createElement("td");
  statusTD.innerText = booking.status;
  if (booking.status == "cancelled") {
    tr.style.backgroundColor = "rgba(255, 0, 0, 0.2)"
  }
  tr.appendChild(statusTD);
  const actionTD = document.createElement("td");
  const alink = document.createElement("a")
  alink.innerText = "reschedule or cancel"
  alink.href = `https://book.rmtutoringservices.com/booking/${booking.uid}?changes=true`
  actionTD.appendChild(alink)
  if (booking.status == "cancelled") {
    tr.style.backgroundColor = "rgba(255, 0, 0, 0.2)"
  }
  tr.appendChild(actionTD);
  tbody.appendChild(tr);
}


async function getVideos(email) {
  const url = `${VIDEO_API_URL}/videos/${email}`;
  console.log("Fetching from:", url);

  try {
    const response = await fetch(url);
    console.log("Raw response:", response);

    if (!response.ok) {
      console.error("Non-OK HTTP status:", response.status);
      return [];
    }

    const data = await response.json();
    console.log("Parsed JSON:", data);

    if (data.error) {
      console.error("API error:", data.error);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    return [];
  }
}

export async function listVideos(email) {
  const videos = await getVideos(email);
  const display = document.getElementById("user-videos");
  if (!videos.length) {
    const p = document.createElement("p");
    p.innerText = "No videos were found for your account...";
    display.appendChild(p);
    return;
  }
  display.innerHTML = "<h3>Your Past Sessions</h3>"; // Clear previous content

  videos.forEach((video) => {
    createVideoTag(320, 500, video.url);
  });
}

async function getBookings(email) {
  const url = `${VIDEO_API_URL}/bookings/${email}`;
  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    console.log("error while trying to fetch bookings:", error);
    return;
  }
}

export async function listBookings(email) {
  const bookings = await getBookings(email);
  console.log("Bookings:", bookings)
  bookings.forEach((booking) => {
    createTD(booking);
  });
}

export function displayUserGreeting() {
    const name = localStorage.getItem("username") || "there";
    const email = localStorage.getItem("email") || "";
    const greeting = `Welcome${name !== "there" ? `, ${name}` : ""}!`;

    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });

    document.getElementById("greeting-message").innerText = greeting;
    document.getElementById("greeting-date").innerText = `Today is ${dateStr}`;

    const avatar = document.getElementById("user-avatar");
    if (name && name !== "there") {
      avatar.innerText = name[0].toUpperCase();
    } else if (email) {
      avatar.innerText = email[0].toUpperCase();
    }
}

export async function deleteAccount() {
  const user = authHandler.auth.currentUser;
  if (!user) {
    console.error("No user is signed in.");
    return;
  }
  await authHandler.deleteAccount(user);
}
