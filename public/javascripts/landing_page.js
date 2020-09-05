
function scrollDown() {
    document.getElementById("feature-showcase").scrollIntoView({ behavior: 'smooth' });
}

function closePopup() {

    document.getElementById("popup-background").style.display = "none";
    document.getElementById("popup").style.display = "none";
    document.getElementById("sign-in").style.display = "none";
    document.getElementById("sign-up").style.display = "none";

}

function signIn() {
    closePopup();
    document.getElementById("popup-background").style.display = "block";
    document.getElementById("popup").style.display = "block";
    document.getElementById("sign-in").style.display = "block";

}

function signUp() {
    closePopup();
    document.getElementById("popup-background").style.display = "block";
    document.getElementById("popup").style.display = "block";
    document.getElementById("sign-up").style.display = "block";

}

function onSignIn(googleUser) {
    var id_token = googleUser.getAuthResponse().id_token;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/login');
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function() {
        window.location.href = "/home";
    };
    xhr.send('idtoken=' + id_token);
}
