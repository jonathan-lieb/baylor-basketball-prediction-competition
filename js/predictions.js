// ------------------------------------------------------------
// AUTHENTICATION
// ------------------------------------------------------------

async function getCurrentUser() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {

        window.location.href = "login.html";

        return null;
    }

    return user;
}


// ------------------------------------------------------------
// FORMAT DATE
// ------------------------------------------------------------

function formatGameDate(dateString) {

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


// ------------------------------------------------------------
// FORMAT TIME
// ------------------------------------------------------------

function formatGameTime(dateString) {

    if (!dateString) {
        return "Time TBD";
    }

    return new Date(dateString).toLocaleTimeString(
        undefined,
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

// ------------------------------------------------------------
// LOAD PREDICTIONS
// ------------------------------------------------------------

async function loadPredictions() {

    const user = await getCurrentUser();

    if (!user) {
        return;
    }
    
    // Automatically lock predictions for games that have started
const { error: autoLockError } = await supabaseClient.rpc(
    "auto_lock_started_predictions"
);

if (autoLockError) {
    console.error("Automatic lock error:", autoLockError);
}


    const welcomeMessage =
        document.getElementById("welcome-message");


    // Get profile

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();


    if (!profileError && profile) {

        welcomeMessage.textContent =
            `Welcome, ${profile.display_name}`;

    }


    // Get games

    const {
        data: games,
        error: gamesError
    } = await supabaseClient
        .from("games")
        .select("*")
        .order("tipoff_time", {
            ascending: true
        });

    
    if (gamesError) {

    console.error("Games error:", gamesError);

    document.getElementById(
        "predictions-container"
    ).textContent =
        `Unable to load games: ${gamesError.message}`;

    return;
}


    // Get user's predictions

const {
    data: predictions,
    error: predictionsError
} = await supabaseClient
    .from("predictions")
    .select("*")
    .eq("user_id", user.id);

    console.log("Games returned:", games);
    console.log("Games error:", gamesError);

    if (predictionsError) {

        console.error(predictionsError);

        document.getElementById(
            "predictions-container"
        ).textContent =
            "Unable to load predictions.";

        return;
    }


    // Turn predictions into a lookup object

    const predictionMap = {};

predictions.forEach(function(prediction) {

    if (!predictionMap[prediction.game_id]) {
        predictionMap[prediction.game_id] = [];
    }

    predictionMap[prediction.game_id].push(prediction);

});


    const container =
        document.getElementById(
            "predictions-container"
        );


    container.innerHTML = "";


    // Create a card for every game

    games.forEach(function(game) {

const gamePredictions =
    predictionMap[game.id] || [];

const myPrediction =
    gamePredictions.find(function(prediction) {
        return prediction.user_id === user.id;
    });


        const card =
            document.createElement("div");

        card.className =
            "game-card";


        const title =
            document.createElement("h3");

        title.textContent =
            `Baylor vs. ${game.opponent}`;

        card.appendChild(title);


        const date =
            document.createElement("p");

        date.textContent =
            `${formatGameDate(game.game_date)} • ` +
            `${formatGameTime(game.tipoff_time)} • ` +
            `${game.location}`;

        card.appendChild(date);


        // Probability input

        const label =
            document.createElement("label");

        label.textContent =
            "Baylor win probability:";

        card.appendChild(label);


        const input =
            document.createElement("input");

        input.type = "number";

        input.min = "0";

        input.max = "100";

        input.step = "1";

        input.className =
            "probability-input";


        if (myPrediction) {

            input.value =
                Math.round(
                    Number(myPrediction.probability) * 100
                );

        }


        card.appendChild(input);


        // Save button

        const saveButton =
            document.createElement("button");

        saveButton.textContent =
            "Save";

        saveButton.className =
            "button";


        // Lock button

        const lockButton =
            document.createElement("button");

        lockButton.textContent =
            "Lock";

        lockButton.className =
            "button";


        const status =
            document.createElement("span");

        status.className =
            "prediction-status";


        // Existing locked prediction

// Locked prediction or game has started

const gameStarted =
    game.tipoff_time &&
    new Date(game.tipoff_time) <= new Date();

if (
    myPrediction &&
    myPrediction.user_locked
) {

    input.disabled = true;

    saveButton.disabled = true;

    lockButton.disabled = true;

    status.textContent =
        " 🔒 Locked";

}
else if (gameStarted) {

    input.disabled = true;

    saveButton.disabled = true;

    lockButton.disabled = true;

    status.textContent =
        " 🔒 Game Started";

}


        // Save prediction

        saveButton.addEventListener(
            "click",
            async function() {

                await savePrediction(
                    user.id,
                    game.id,
                    input,
                    status
                );

            }
        );


        // Lock prediction

        lockButton.addEventListener(
            "click",
            async function() {

                await lockPrediction(
                    user.id,
                    game.id,
                    input,
                    saveButton,
                    lockButton,
                    status
                );

            }
        );

const othersTitle =
    document.createElement("p");

othersTitle.textContent =
    "Other predictions:";

card.appendChild(othersTitle);


const otherPredictions =
    gamePredictions.filter(function(prediction) {

        return prediction.user_id !== user.id;

    });


if (otherPredictions.length === 0) {

    const noOthers =
        document.createElement("p");

    noOthers.textContent =
        myPrediction && myPrediction.user_locked
            ? "No other predictions yet."
            : "🔒 Lock your prediction to see others.";

    card.appendChild(noOthers);

}
else {

    const list =
        document.createElement("ul");

    otherPredictions.forEach(function(prediction) {

        const item =
            document.createElement("li");

        const name =
            prediction.profiles
                ? prediction.profiles.display_name
                : "Contestant";

        const probability =
            Math.round(
                Number(prediction.probability) * 100
            );

        item.textContent =
            `${name}: ${probability}%`;

        list.appendChild(item);

    });

    card.appendChild(list);

}

        card.appendChild(saveButton);

        card.appendChild(lockButton);

        card.appendChild(status);


        container.appendChild(card);

    });

}


// ------------------------------------------------------------
// SAVE PREDICTION
// ------------------------------------------------------------

async function savePrediction(
    userId,
    gameId,
    input,
    status
) {

    const percentage =
        Number(input.value);


    if (
        Number.isNaN(percentage) ||
        percentage < 0 ||
        percentage > 100
    ) {

        status.textContent =
            " Enter a probability from 0 to 100.";

        return;
    }


    const probability =
        percentage / 100;


    const {
        error
    } = await supabaseClient
        .from("predictions")
        .upsert(
            {
                user_id: userId,
                game_id: gameId,
                probability: probability
            },
            {
                onConflict:
                    "user_id,game_id"
            }
        );


    if (error) {

        console.error(error);

        status.textContent =
            ` ${error.message}`;

        return;
    }


    status.textContent =
        " ✓ Saved";

}


// ------------------------------------------------------------
// LOCK PREDICTION
// ------------------------------------------------------------

async function lockPrediction(
    userId,
    gameId,
    input,
    saveButton,
    lockButton,
    status
) {

    const percentage =
        Number(input.value);


    if (
        Number.isNaN(percentage) ||
        percentage < 0 ||
        percentage > 100
    ) {

        status.textContent =
            " Enter a probability from 0 to 100 first.";

        return;
    }


    const probability =
        percentage / 100;


    // First create/update the prediction

    const {
        data,
        error
    } = await supabaseClient
        .from("predictions")
        .upsert(
            {
                user_id: userId,
                game_id: gameId,
                probability: probability,
                user_locked: true
            },
            {
                onConflict:
                    "user_id,game_id"
            }
        )
        .select()
        .single();


    if (error) {

        console.error(error);

        status.textContent =
            ` ${error.message}`;

        return;
    }


    // Disable controls

    input.disabled = true;

    saveButton.disabled = true;

    lockButton.disabled = true;


    status.textContent =
        " 🔒 Locked";

}



// ------------------------------------------------------------
// START
// ------------------------------------------------------------

loadPredictions();


