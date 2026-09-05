// ------------------------------------------------------------
// AUTHENTICATION
// ------------------------------------------------------------

async function requireUser() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {

        window.location.href = "login.html";

        return null;
    }

    return user;
}


// ------------------------------------------------------------
// LOG OUT
// ------------------------------------------------------------

const logoutButton =
    document.getElementById("logout-button");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function() {

            await supabaseClient.auth.signOut();

            window.location.href =
                "index.html";

        }
    );
}


// ------------------------------------------------------------
// HIGHLIGHT CURRENT PAGE
// ------------------------------------------------------------

const currentPage =
    window.location.pathname.split("/").pop();

document
    .querySelectorAll(".site-nav a")
    .forEach(function(link) {

        const linkPage =
            link.getAttribute("href");

        if (linkPage === currentPage) {
            link.classList.add("active");
        }

    });