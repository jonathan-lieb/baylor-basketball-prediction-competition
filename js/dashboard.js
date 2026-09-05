// ============================================================
// DASHBOARD
// ============================================================


async function loadDashboard() {

    // Get currently logged-in user

    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();


    // No user means they aren't logged in

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }


    // Get the user's profile

    const {
        data: profile,
        error
    } = await supabaseClient
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();


    if (error) {

        console.error(error);

        document.getElementById("display-name")
            .textContent = "Contestant";

        return;
    }


    // Display their name

    document.getElementById("display-name")
        .textContent = profile.display_name;
}


// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------

const logoutButton =
    document.getElementById("logout-button");


if (logoutButton) {

    logoutButton.addEventListener("click", async function() {

        const {
            error
        } = await supabaseClient.auth.signOut();


        if (error) {

            console.error(error);

            return;
        }


        window.location.href =
            "index.html";

    });

}


// ------------------------------------------------------------
// LOAD DASHBOARD
// ------------------------------------------------------------

loadDashboard();