import { authHandlerPromise } from '../scripts/auth.js';

export function handleLoginLink() {
    const username = localStorage.getItem("username");
    if (username) {
        document.getElementById("dashboard-link").href = "pages/dashboard.html";
        document.getElementById("dashboard-link").innerHTML = "Dashboard";
        document.getElementById("login-link").innerHTML = `Logout from ${username}`;
        document.getElementById("login-link").href = "javascript:void(0);";
        document.getElementById("login-link").onclick = function() {
            authHandlerPromise.then(authHandler => {
                authHandler.logout();
                window.location.href = "../index.html";
            });
        };
    }
}