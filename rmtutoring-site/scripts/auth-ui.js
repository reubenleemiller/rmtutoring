import { authHandler } from '../scripts/auth.js';


export function handleLoginLink() {
    const user = localStorage.getItem("email");
    if (user) {
        document.getElementById("dashboard-link").href = "pages/dashboard.html";
        document.getElementById("dashboard-link").innerHTML = "Dashboard";
        document.getElementById("login-link").innerHTML = `Logout from ${user}`;
        document.getElementById("login-link").href = "javascript:void(0);";
        document.getElementById("login-link").onclick = function() {
            authHandler.logout();
            window.location.href = "../index.html";
        };
    }
}