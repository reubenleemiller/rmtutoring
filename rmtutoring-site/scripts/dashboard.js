import { authHandler } from "../scripts/auth.js" 

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


function getSessionKey(video) {
  if (video.key) {
    return video.key.split('/')[1];
  }
  return null;
}

function attachFolderToggles() {
  const headers = document.querySelectorAll(".folder-header");
  headers.forEach(header => {
    header.addEventListener("click", () => {
      const targetId = header.getAttribute("data-toggle");
      const body = document.getElementById(targetId);
      body.style.display = body.style.display === "none" ? "block" : "none";
    });
  });
}

function groupVideosBySession(videos) {
  const grouped = {};
  videos.forEach(video => {
    const sessionKey = getSessionKey(video);
    if (!sessionKey) return; // Skip if no session key
    if (!grouped[sessionKey]) {
      grouped[sessionKey] = [];
    }
    grouped[sessionKey].push(video);
  });
  return grouped;
}

async function fetchVideoContent(video) {
  console.log("Fetching content...");
    const content = await fetch(video.url);
    console.log("Fetched content:", content);
    if (!content.ok) {
      console.error("Failed to fetch video content:", content.statusText);
      return;
    }
    const blob = await content.blob();
    const url = URL.createObjectURL(blob);

    return url;
}

async function attachButton(video, li) {
  const button = document.createElement("a");
  button.className = "download-btn";
  button.setAttribute("data-url", video.url);

  const textSpan = document.createElement("span");
  textSpan.className = "btn-text";
  textSpan.textContent = "Download";

  const spinnerSpan = document.createElement("span");
  spinnerSpan.className = "spinner";
  spinnerSpan.setAttribute("aria-hidden", "true");

  button.appendChild(textSpan);
  button.appendChild(spinnerSpan);

  const url = await fetchVideoContent(video);

  button.href = url;
  button.download = video.name || video.key; // Use video name or key as filename
  button.addEventListener("click", (event) => {
    console.log("Download button clicked for video:", video);
    
    spinnerSpan.style.display = "inline-block"; // Show spinner

    setTimeout(() => {
      spinnerSpan.style.display = "none"; // Hide spinner after download
      textSpan.style.display = "inline"; // Show text again
    }, 2000); // Simulate download time
  });
  li.appendChild(button);
}


function createVideoElement(video) {
  const folder = document.createElement("div");
  folder.className = "folder";

  folder.innerHTML = `
    <div class="folder-header">${video.name || video.key}</div>
    <div class="folder-body">
      <ul>
        <!-- The download buttons will be injected here -->
      </ul>
    </div>
  `;
  // Find the <ul> to append the <li> into
  const ul = folder.querySelector("ul");
  const li = document.createElement("li");
  li.style.alignItems = "center";
  li.style.display = "flex";
  li.style.flexDirection = "column";
  li.style.justifyContent = "center";

  attachButton(video, ul, li);
  ul.appendChild(li);
  return folder;
}

function createTD(booking) {

  // todo: wth is this function? refactor
  const tbody = document.querySelector("#schedule-table tbody");
  const tr = document.createElement("tr");
  const descTD = document.createElement("td");
  descTD.innerText = booking.title;
  tr.appendChild(descTD);
  descTD.setAttribute("data-label", "Title");
  const startTD = document.createElement("td");
  startTD.innerText = formatDate(booking.startTime);
  startTD.setAttribute("data-label", "Start Time");
  tr.appendChild(startTD);
  const endTD = document.createElement("td");
  endTD.innerText = formatDate(booking.endTime);
  endTD.setAttribute("data-label", "End Time");
  tr.appendChild(endTD);
  const statusTD = document.createElement("td");
  statusTD.innerText = booking.status;
  statusTD.setAttribute("data-label", "Status");
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
  display.innerHTML = "<h3>Your Past Sessions</h3>\n<div id=\"video-folders\" class=\"folders-grid\">"; // Clear previous content

  const parent = document.getElementById("video-folders");
  const grouped = groupVideosBySession(videos);
  Object.keys(grouped).forEach(sessionKey => {
    const videoList = grouped[sessionKey];
    const video = videoList[0]; // Use the first video as the session header
    const folder = createVideoElement(video);
    folder.querySelector(".folder-header").setAttribute("data-toggle", `body-${sessionKey}`);
    folder.querySelector(".folder-body").id = `body-${sessionKey}`;
    folder.querySelector(".folder-body").style.display = "none"; // Initially hide the body
    parent.appendChild(folder);
  });
  attachFolderToggles(); // Attach click handlers to toggle folder visibility

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
