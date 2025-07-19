import { authHandler } from '../scripts/auth.js';

const VIDEO_API_URL = "https://expressjs-production-bc5b.up.railway.app"
//todo: import from railway instead


function createVideoTag(width, height, src) {
  const parent = document.getElementById("user-videos")
  const videoElement =  document.createElement("video");
  videoElement.width = String(width);
  videoElement.width = String(height);
  videoElement.controls = true;
  videoElement.src = src;
  videoElement.className = "video-item"

  // Do more stuff

  parent.appendChild(videoElement)
}

 
export async function getVideos(mail) {
  const url = `${VIDEO_API_URL}/videos/${mail}`;
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

export async function listVideos(mail) {
  const videos = await getVideos(mail);
  const display = document.getElementById("user-videos");
  if (!videos.length) {
    console.log("waow")
    const p = document.createElement("p")
    p.innerText = "No videos were found for your account..."
    display.appendChild(p);
    return;
  }
  display.innerHTML = "<h3>Your Past Sessions</h3>"; // Clear previous content

  videos.forEach((video) => {
    createVideoTag(320, 500, video.url)
  });
}

export function displayUserGreeting() {
  console.log("Displaying user greeting");
  const user = localStorage.getItem("email");
  const greetingElement = document.getElementById("user-greeting");

  if (user) {
    greetingElement.textContent = `Welcome back, ${user}.`;
    getVideos(user);
  } else {
    greetingElement.textContent = "Welcome to RM Tutoring!";
    document.querySelector(".video-gallery").innerHTML =
      "<p>Please log in to see your sessions.</p>";
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
