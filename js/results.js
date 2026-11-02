
// ------------------------------------------------------------
// LOAD BAYLOR RESULTS
// ------------------------------------------------------------

async function loadResults() {

    const user = await requireUser();

    if (!user) {
        return;
    }

    const container =
        document.getElementById("results-container");


    // --------------------------------------------------------
    // GET COMPLETED GAMES
    // --------------------------------------------------------

    const {
        data: games,
        error: gamesError
    } = await supabaseClient
        .from("games")
        .select("*")
        .eq("status", "final")
        .order("tipoff_time", {
            ascending: false
        });


    if (gamesError) {

        console.error(gamesError);

        container.textContent =
            `Unable to load results: ${gamesError.message}`;

        return;
    }


    if (!games || games.length === 0) {

        container.innerHTML =
            "<p>No completed Baylor games yet.</p>";

        return;
    }


    // --------------------------------------------------------
    // GET ALL PREDICTIONS FOR COMPLETED GAMES
    // --------------------------------------------------------

    const gameIds =
        games.map(game => game.id);

    const {
    data: predictions,
    error: predictionsError
} = await supabaseClient
    .from("predictions")
    .select("game_id, user_id, probability")
    .in("game_id", gameIds);

if (predictionsError) {
    console.error("Predictions error:", predictionsError);
    container.textContent =
        `Unable to load predictions: ${predictionsError.message}`;
    return;
}

const {
    data: profiles,
    error: profilesError
} = await supabaseClient
    .from("profiles")
    .select("id, display_name");

if (profilesError) {
    console.error("Profiles error:", profilesError);
    container.textContent =
        `Unable to load contestant names: ${profilesError.message}`;
    return;
}

console.log("Predictions user IDs:", predictions.map(p => p.user_id));
console.log("Profiles returned:", profiles);

const profileMap = new Map(
    profiles.map(profile => [profile.id, profile.display_name])
);

    // --------------------------------------------------------
    // GROUP PREDICTIONS BY GAME
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
    // DISPLAY GAMES
    // --------------------------------------------------------

    container.innerHTML = "";


    games.forEach(function(game) {

        const card =
            document.createElement("div");

        card.className =
            "game-card";


        // Game title

        const title =
            document.createElement("h3");

        title.textContent =
            `Baylor vs. ${game.opponent}`;

        card.appendChild(title);


        // Date

        const date =
            document.createElement("p");

        date.textContent =
            formatResultDate(game.tipoff_time);

        card.appendChild(date);


        // Score

        const score =
            document.createElement("p");

        score.className =
            "game-score";

        score.textContent =
            `Baylor ${game.baylor_score} - ` +
            `${game.opponent} ${game.opponent_score}`;

        card.appendChild(score);


        // ----------------------------------------------------
        // DETERMINE ACTUAL OUTCOME
        // ----------------------------------------------------

        const baylorWon =
            Number(game.baylor_score) >
            Number(game.opponent_score);


        const actualOutcome =
            baylorWon ? 1 : 0;


        // ----------------------------------------------------
        // GET GAME PREDICTIONS
        // ----------------------------------------------------

        const gamePredictions =
            predictionMap[game.id] || [];


        // Sort by points earned, highest first

        const scoredPredictions =
            gamePredictions.map(function(prediction) {

                const probability =
                    Number(prediction.probability);

                const points =
                    100 * (
                        1 -
                        Math.pow(
                            probability - actualOutcome,
                            2
                        )
                    );

                return {
                    ...prediction,
                    points: points
                };

            }).sort(function(a, b) {

                return b.points - a.points;

            });


        // ----------------------------------------------------
        // EXPANDABLE PREDICTIONS SECTION
        // ----------------------------------------------------

        const details =
            document.createElement("details");

        details.className =
            "results-predictions";


        const summary =
            document.createElement("summary");

        summary.textContent =
            `View Predictions (${scoredPredictions.length})`;

        details.appendChild(summary);


        if (scoredPredictions.length === 0) {

            const noPredictions =
                document.createElement("p");

            noPredictions.textContent =
                "No predictions were submitted for this game.";

            details.appendChild(noPredictions);

        }

        else {

            const table =
                document.createElement("table");

            table.className =
                "leaderboard-table";


            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Contestant</th>
                        <th>Baylor Win Probability</th>
                        <th>Points</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;


            const tbody =
                table.querySelector("tbody");


            scoredPredictions.forEach(
                function(prediction) {

                    const row =
                        document.createElement("tr");


                    const name =
                        prediction.profiles
                            ? profileMap.get(prediction.user_id) || "Contestant"
                            : "Contestant";


                    const probability =
                        Math.round(
                            Number(prediction.probability) * 100
                        );


                    const contestantCell =
                        document.createElement("td");

                    contestantCell.textContent =
                        name;


                    const probabilityCell =
                        document.createElement("td");

                    probabilityCell.textContent =
                        `${probability}%`;


                    const pointsCell =
                        document.createElement("td");

                    pointsCell.textContent =
                        prediction.points.toFixed(2);


                    row.appendChild(contestantCell);
                    row.appendChild(probabilityCell);
                    row.appendChild(pointsCell);

                    tbody.appendChild(row);

                }
            );


            details.appendChild(table);

        }


        card.appendChild(details);

        container.appendChild(card);

    });

}


// ------------------------------------------------------------
// FORMAT DATE
// ------------------------------------------------------------

function formatResultDate(dateString) {

    const date =
        new Date(dateString);

    return date.toLocaleDateString(
        undefined,
        {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


// ------------------------------------------------------------
// START
// ------------------------------------------------------------

loadResults();
