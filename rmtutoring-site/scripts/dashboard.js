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

function buttonCallback(video, li, spinnerSpan, textSpan) {
    console.log("Download button clicked for video:", video);

    const embed = document.createElement("video");
    embed.src = video.url;
    embed.controls = true;
    embed.style.width = "150px";
    embed.style.height = "auto";
    embed.style.margin = "10px 0"; // Add some margin for better spacing
    console.log("li.children.length:", li.children.length);
    if (li.children.length < 2) {
      li.appendChild(embed);
    }
    // Show spinner and hide text
    spinnerSpan.style.display = "inline-block"; 
    spinnerSpan.style.visibility = "visible";

    // Hide spinner after download and show text again
    setTimeout(() => {
      spinnerSpan.style.display = "none"; 
      textSpan.style.display = "inline";
    }, 2000); // Simulate download time
}

async function attachLink(video, li) {
  // todo: wth is this function? refactor
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

  // attach callback
  button.addEventListener("click", (_event) => {
    buttonCallback(video, li, spinnerSpan, textSpan);
  });
  
  li.appendChild(button);
}

async function getVideoDate(video) {
  const response = await fetch(VIDEO_API_URL + `/date/${getSessionKey(video)}`);
  const data = await response.json();
  console.log("Video date response:", data);
  if (data.error) {
    console.error("Error fetching video date:", data.error);
    return null;
  }
  return formatDate(data[0].startTime);
}

function createFolder(video) {
  const folder = document.createElement("div");
  folder.className = "folder";

  folder.innerHTML = `
    <div class="folder-header">${getVideoDate(video) || video.key}</div>
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

  attachLink(video, li);
  ul.appendChild(li);
  return folder;
}

function instanceTd(innerHTML, data) {
  const td = document.createElement("td");
  td.innerHTML = innerHTML;
  td.setAttribute("data-label", data);
  return td;
}

function createTD(booking) {
  const tbody = document.querySelector("#schedule-table tbody");
  const tr = document.createElement("tr");

  tr.appendChild(instanceTd(booking.title, "Title of Session"));
  tr.appendChild(instanceTd(formatDate(booking.startTime), "Start Time"));
  tr.appendChild(instanceTd(formatDate(booking.endTime), "End Time"));
  tr.appendChild(instanceTd(booking.status, "Status"));
  if (booking.status == "cancelled") {
    tr.style.backgroundColor = "rgba(255, 0, 0, 0.2)"
  }
  const actionTD = document.createElement("td");
  const alink = document.createElement("a")
  alink.innerText = "reschedule or cancel"
  alink.href = `https://book.rmtutoringservices.com/booking/${booking.uid}?changes=true`
  actionTD.appendChild(alink)
  tr.appendChild(actionTD);
  if (booking.status == "cancelled") {
    tr.style.backgroundColor = "rgba(255, 0, 0, 0.2)"
  }
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
    const folder = createFolder(video);
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
