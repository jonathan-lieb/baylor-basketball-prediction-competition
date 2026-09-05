// ============================================================
// AUTHENTICATION
// ============================================================


// ------------------------------------------------------------
// SIGN UP
// ------------------------------------------------------------

const signupForm = document.getElementById("signup-form");


if (signupForm) {

    signupForm.addEventListener("submit", async function(event) {

        event.preventDefault();


        const displayName =
            document.getElementById("display-name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirm-password").value;

        const message =
            document.getElementById("message");


        // Check passwords

        if (password !== confirmPassword) {

            message.textContent =
                "Passwords do not match.";

            return;
        }


        // Create Supabase account

        const {
            data,
            error
        } = await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {
    data: {
        display_name: displayName
    },
    emailRedirectTo:
        "https://jonathan-lieb.github.io/baylor-basketball-prediction-competition/dashboard.html"
}

        });


        if (error) {

            message.textContent =
                error.message;

            return;
        }


        // If email confirmation is required,
        // Supabase will not immediately give us
        // an authenticated session.

        if (!data.session) {

            message.textContent =
                "Account created! Check your email to confirm your account.";

            return;
        }


        // If email confirmation is disabled,
        // we already have a session.

        window.location.href =
            "dashboard.html";

    });

}


// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------

const loginForm = document.getElementById("login-form");


if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();


        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("message");


        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });


        if (error) {

            message.textContent =
                error.message;

            return;
        }


        window.location.href =
            "dashboard.html";

    });

}