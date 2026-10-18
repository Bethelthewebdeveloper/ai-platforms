document.addEventListener("DOMContentLoaded", function () {
    const userNameElement = document.getElementById("userName");
    const greetingElement = document.getElementById("greeting");

    // Get the logged-in user's name
    const userName = localStorage.getItem("userName");

    if (userName) {
        userNameElement.textContent = userName;
    } else {
        userNameElement.textContent = "User";
    }

    // Set greeting according to the current time
    const hour = new Date().getHours();

    if (hour < 12) {
        greetingElement.textContent = "Good morning";
    } else if (hour < 17) {
        greetingElement.textContent = "Good afternoon";
    } else {
        greetingElement.textContent = "Good evening";
    }
});