// ------------------------------------------------------------
// AUTHENTICATION
// ------------------------------------------------------------

async function getCurrentUser() {

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


    // --------------------------------------------------------
    // Initialize missing predictions at 0.5
    // --------------------------------------------------------

    const {
        error: initializeError
    } = await supabaseClient.rpc(
        "initialize_my_predictions"
    );

    if (initializeError) {

        console.error(
            "Prediction initialization error:",
            initializeError
        );

    }



    // --------------------------------------------------------
    // Automatically lock predictions for games that have started
    // --------------------------------------------------------

    const {
        error: autoLockError
    } = await supabaseClient.rpc(
        "auto_lock_started_predictions"
    );

    if (autoLockError) {

        console.error(
            "Automatic lock error:",
            autoLockError
        );

    }


    // --------------------------------------------------------
    // Get games
    // --------------------------------------------------------

    const {
        data: games,
        error: gamesError
    } = await supabaseClient
        .from("games")
        .select("*")
        .order("game_date", {
            ascending: true
        });


    if (gamesError) {

        console.error(
            "Games error:",
            gamesError
        );

        document.getElementById(
            "predictions-container"
        ).textContent =
            `Unable to load games: ${gamesError.message}`;

        return;
    }


    // --------------------------------------------------------
    // Get user's predictions
    // --------------------------------------------------------

    const {
        data: predictions,
        error: predictionsError
    } = await supabaseClient
        .from("predictions")
        .select("*")
        .eq("user_id", user.id);


    if (predictionsError) {

        console.error(
            "Predictions error:",
            predictionsError
        );

        document.getElementById(
            "predictions-container"
        ).textContent =
            `Unable to load predictions: ${predictionsError.message}`;

        return;
    }


    console.log("Games returned:", games);
    console.log("Predictions returned:", predictions);

    setupCsvTools(games, predictions, user);

    // --------------------------------------------------------
    // Turn predictions into a lookup object
    // --------------------------------------------------------

    const predictionMap = {};

    predictions.forEach(function(prediction) {

        if (!predictionMap[prediction.game_id]) {

            predictionMap[prediction.game_id] = [];

        }

        predictionMap[prediction.game_id].push(
            prediction
        );

    });


    // --------------------------------------------------------
    // Get page container
    // --------------------------------------------------------

    const container =
        document.getElementById(
            "predictions-container"
        );


    container.innerHTML = "";


    // --------------------------------------------------------
    // Create a card for every game
    // --------------------------------------------------------

    games.forEach(function(game) {

        const gamePredictions =
            predictionMap[game.id] || [];


        const myPrediction =
            gamePredictions.find(function(prediction) {

                return prediction.user_id === user.id;

            });


        // ----------------------------------------------------
        // Game card
        // ----------------------------------------------------

        const card =
            document.createElement("div");

        card.className =
            "game-card";


        // ----------------------------------------------------
        // Game title
        // ----------------------------------------------------

        const title =
            document.createElement("h3");

        title.textContent =
            `Baylor vs. ${game.opponent}`;

        card.appendChild(title);


        // ----------------------------------------------------
        // Date / time / location
        // ----------------------------------------------------

        const date =
            document.createElement("p");

        date.textContent =
            `${formatGameDate(game.game_date)} • ` +
            `${formatGameTime(game.tipoff_time)} • ` +
            `${game.location}`;

        card.appendChild(date);


        // ----------------------------------------------------
        // Probability label
        // ----------------------------------------------------

        const label =
            document.createElement("label");

        label.textContent =
            "Baylor win probability:";

        card.appendChild(label);


        // ----------------------------------------------------
        // Probability input
        // ----------------------------------------------------

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


        const percentSymbol =
    document.createElement("span");

percentSymbol.textContent = "%";

percentSymbol.className =
    "probability-percent";

card.appendChild(input);
card.appendChild(percentSymbol);


        // ----------------------------------------------------
        // Save button
        // ----------------------------------------------------

        const saveButton =
            document.createElement("button");

        saveButton.textContent =
            "Save";

        saveButton.className =
            "button";


        // ----------------------------------------------------
        // Lock button
        // ----------------------------------------------------

        const lockButton =
            document.createElement("button");

        lockButton.textContent =
            "Lock";

        lockButton.className =
            "button";


        // ----------------------------------------------------
        // Status message
        // ----------------------------------------------------

        const status =
            document.createElement("span");

        status.className =
            "prediction-status";


        // ----------------------------------------------------
        // Determine whether game has started
        // ----------------------------------------------------

        const gameStarted =
            game.tipoff_time &&
            new Date(game.tipoff_time) <= new Date();


        // ----------------------------------------------------
        // Existing locked prediction
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // Game has started
        // ----------------------------------------------------

        else if (gameStarted) {

            input.disabled = true;

            saveButton.disabled = true;

            lockButton.disabled = true;

            status.textContent =
                " 🔒 Game Started";

        }


        // ----------------------------------------------------
        // Save prediction
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // Lock prediction
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // Other predictions
        // ----------------------------------------------------

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


            otherPredictions.forEach(
                function(prediction) {

                    const item =
                        document.createElement("li");


                    const name =
                        prediction.profiles
                            ? prediction.profiles.display_name
                            : "Contestant";


                    const probability =
                        Math.round(
                            Number(
                                prediction.probability
                            ) * 100
                        );


                    item.textContent =
                        `${name}: ${probability}%`;


                    list.appendChild(item);

                }
            );


            card.appendChild(list);

        }


        // ----------------------------------------------------
        // Add controls to card
        // ----------------------------------------------------

        card.appendChild(saveButton);

        card.appendChild(lockButton);

        card.appendChild(status);


        // ----------------------------------------------------
        // Add card to page
        // ----------------------------------------------------

        container.appendChild(card);

    });

}

// ------------------------------------------------------------
// CSV TOOLS
// ------------------------------------------------------------

function setupCsvTools(games, predictions, user) {

    const downloadButton =
        document.getElementById(
            "download-csv-button"
        );

    const fileInput =
        document.getElementById(
            "csv-file-input"
        );


    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            function() {

                downloadPredictionsCsv(
                    games,
                    predictions
                );

            }
        );

    }


    if (fileInput) {

        fileInput.addEventListener(
            "change",
            async function(event) {

                const file =
                    event.target.files[0];

                console.log(
                    "CSV file selected:",
                    file
                );

                if (!file) {
                    return;
                }

                await uploadPredictionsCsv(
                    file,
                    games,
                    user
                );

                fileInput.value = "";

            }
        );

    }

}

function downloadPredictionsCsv(
    games,
    predictions
) {

    const predictionMap = {};

    predictions.forEach(function(prediction) {

        predictionMap[prediction.game_id] =
            prediction;

    });


    const rows = [];


    rows.push([
        "game_id",
        "game_date",
        "opponent",
        "location",
        "probability"
    ]);


    games.forEach(function(game) {

        const prediction =
            predictionMap[game.id];


        const probability =
            prediction
                ? Number(prediction.probability)
                : 0.5;


        rows.push([
            game.id,
            game.game_date,
            game.opponent,
            game.location,
            probability.toFixed(4)
        ]);

    });


    const csv =
        rows
            .map(function(row) {

                return row
                    .map(function(value) {

                        const text =
                            String(value);

                        if (
                            text.includes(",") ||
                            text.includes('"') ||
                            text.includes("\n")
                        ) {

                            return '"' +
                                text.replace(
                                    /"/g,
                                    '""'
                                ) +
                                '"';

                        }

                        return text;

                    })
                    .join(",");

            })
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "baylor_predictions.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}

function normalizeCsvDate(dateString) {

    const trimmed =
        dateString.trim();

    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }

    // Excel-style M/D/YYYY or MM/DD/YYYY
    const parts =
        trimmed.split("/");

    if (parts.length === 3) {

        const month =
            parts[0].padStart(2, "0");

        const day =
            parts[1].padStart(2, "0");

        const year =
            parts[2];

        if (/^\d{4}$/.test(year)) {
            return `${year}-${month}-${day}`;
        }
    }

    return trimmed;
}

// ------------------------------------------------------------
// CSV UPLOAD
// ------------------------------------------------------------

async function uploadPredictionsCsv(
    file,
    games,
    user
) {
  
          console.log(
    "Starting CSV upload:",
    file.name
);

    const status =
        document.getElementById("csv-status");


    status.textContent =
        "Reading CSV...";


    // --------------------------------------------------------
    // Read file
    // --------------------------------------------------------

    let text;

    try {

        text =
            await file.text();

    } catch (error) {

        console.error(error);

        status.textContent =
            "Unable to read CSV file.";

        return;
    }


    // --------------------------------------------------------
    // Parse CSV
    // --------------------------------------------------------

    const lines =
        text
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .split("\n")
            .filter(function(line) {

                return line.trim() !== "";

            });


    if (lines.length < 2) {

        status.textContent =
            "CSV file does not contain any predictions.";

        return;
    }


    const headers =
        parseCsvLine(lines[0]);


    const expectedHeaders = [
        "game_id",
        "game_date",
        "opponent",
        "location",
        "probability"
    ];


    const headersMatch =
        expectedHeaders.every(function(header, index) {

            return headers[index] === header;

        });


    if (
        !headersMatch ||
        headers.length !== expectedHeaders.length
    ) {

        status.textContent =
            "Invalid CSV format. Please use the downloaded predictions CSV.";

        return;
    }


    // --------------------------------------------------------
    // Build game lookup
    // --------------------------------------------------------

    const gameMap = {};

    games.forEach(function(game) {

        gameMap[String(game.id)] =
            game;

    });


    // --------------------------------------------------------
    // Parse rows
    // --------------------------------------------------------

    const uploadedRows = [];

    const seenGameIds = {};


    for (
        let i = 1;
        i < lines.length;
        i++
    ) {

        const values =
            parseCsvLine(lines[i]);


        if (values.length !== 5) {

            status.textContent =
                `Invalid CSV row ${i + 1}.`;

            return;
        }


        const gameId =
            values[0].trim();

        const gameDate =
            values[1].trim();

        const opponent =
            values[2].trim();

        const location =
            values[3].trim();

        const probability =
            Number(
                values[4].trim()
            );


        // ----------------------------------------------------
        // Check game ID
        // ----------------------------------------------------

        if (!gameMap[gameId]) {

            status.textContent =
                `Game ID ${gameId} is not a valid game.`;

            return;
        }


        // ----------------------------------------------------
        // Prevent duplicate games
        // ----------------------------------------------------

        if (seenGameIds[gameId]) {

            status.textContent =
                `Game ID ${gameId} appears more than once.`;

            return;
        }


        seenGameIds[gameId] = true;


        const game =
            gameMap[gameId];


        // ----------------------------------------------------
        // Verify game information
        // ----------------------------------------------------

        const databaseDate =
    String(game.game_date).trim();

const databaseOpponent =
    String(game.opponent).trim();

const databaseLocation =
    String(game.location).trim();


const normalizedGameDate =
    normalizeCsvDate(gameDate);

if (
    game.game_date !== normalizedGameDate ||
    game.opponent !== opponent ||
    game.location !== location
) {

    console.log("CSV game information:", {
        gameId: gameId,
        gameDate: gameDate,
        opponent: opponent,
        location: location
    });

    console.log("Database game information:", {
        gameId: gameId,
        gameDate: databaseDate,
        opponent: databaseOpponent,
        location: databaseLocation
    });

    status.textContent =
        `Game information for ${game.opponent} does not match the database.`;

    return;
}


        // ----------------------------------------------------
        // Validate probability
        // ----------------------------------------------------

        if (
            Number.isNaN(probability) ||
            probability < 0 ||
            probability > 1
        ) {

            status.textContent =
                `Invalid probability for ${game.opponent}. Use a value between 0 and 1.`;

            return;
        }


        uploadedRows.push({
            game: game,
            probability: probability
        });

    }


    // --------------------------------------------------------
    // Upload predictions
    // --------------------------------------------------------

    let updatedCount = 0;


    for (const row of uploadedRows) {

        const game =
            row.game;

        const probability =
            row.probability;


        // ----------------------------------------------------
        // Check whether game has started
        // ----------------------------------------------------

        const gameStarted =
            game.tipoff_time &&
            new Date(game.tipoff_time) <= new Date();


        if (gameStarted) {

            console.warn(
                `Skipping ${game.opponent}: game has started.`
            );

            continue;
        }


        // ----------------------------------------------------
        // Check current prediction
        // ----------------------------------------------------

        const {
            data: existingPrediction,
            error: existingError
        } = await supabaseClient
            .from("predictions")
            .select(
                "id,user_locked"
            )
            .eq("user_id", user.id)
            .eq("game_id", game.id)
            .maybeSingle();


        if (existingError) {

            console.error(
                existingError
            );

            status.textContent =
                `Unable to check ${game.opponent}.`;

            return;
        }


        // ----------------------------------------------------
        // Don't modify locked predictions
        // ----------------------------------------------------

        if (
            existingPrediction &&
            existingPrediction.user_locked
        ) {

            console.warn(
                `Skipping ${game.opponent}: prediction is locked.`
            );

            continue;
        }


        // ----------------------------------------------------
        // Save prediction
        // ----------------------------------------------------

        const {
            error: saveError
        } = await supabaseClient
            .from("predictions")
            .upsert(
                {
                    user_id: user.id,
                    game_id: game.id,
                    probability: probability
                },
                {
                    onConflict:
                        "user_id,game_id"
                }
            );


        if (saveError) {

            console.error(
                saveError
            );

            status.textContent =
                `Unable to save ${game.opponent}: ${saveError.message}`;

            return;
        }


        updatedCount++;

    }


    // --------------------------------------------------------
    // Finished
    // --------------------------------------------------------

    status.textContent =
        `✓ ${updatedCount} prediction${
            updatedCount === 1 ? "" : "s"
        } updated.`;


    // --------------------------------------------------------
    // Reload page predictions
    // --------------------------------------------------------

    await loadPredictions();

}

// ------------------------------------------------------------
// PARSE CSV LINE
// ------------------------------------------------------------

function parseCsvLine(line) {

    const values = [];

    let current = "";

    let insideQuotes = false;


    for (
        let i = 0;
        i < line.length;
        i++
    ) {

        const character =
            line[i];


        if (character === '"') {

            if (
                insideQuotes &&
                line[i + 1] === '"'
            ) {

                current += '"';

                i++;

            } else {

                insideQuotes =
                    !insideQuotes;

            }

        }

        else if (
            character === "," &&
            !insideQuotes
        ) {

            values.push(current);

            current = "";

        }

        else {

            current += character;

        }

    }


    values.push(current);


    return values;

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


    // --------------------------------------------------------
    // Create/update prediction and lock it
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Disable controls
    // --------------------------------------------------------

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
