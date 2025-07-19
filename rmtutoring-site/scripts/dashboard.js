import { authHandler } from '../scripts/auth.js';


function createVideoTag(width, height) {
  const parent = document.getElementById("user-videos")
  const videoElement =  document.createElement("video");
  videoElement.width = String(width);
  videoElement.width = String(height);

  // Do more stuff

  parent.appendChild(videoElement)
}

 
export function getVideos(mail) {
  fetch(`/videos/${mail}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        console.error("Error fetching videos:", data.error);
        return;
      }
      listVideos(data);
    })
    .catch((error) => console.error("Error:", error));
}

export function listVideos(videos) {
  const display = document.getElementById("user-videos");
  display.innerHTML = ""; // Clear previous content

  videos.forEach((video) => {
    const videoItem = document.createElement("video");
    videoItem.className = "video-item";
    videoItem.src = video.url;
    videoItem.controls = true;
    display.appendChild(videoItem);
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
