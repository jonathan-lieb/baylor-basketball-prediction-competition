
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
    // GET SCORED RESULTS
    // --------------------------------------------------------

    const {
        data: results,
        error
    } = await supabaseClient
        .from("prediction_scores")
        .select("*")
        .order("game_date", {
            ascending: false
        });


    if (error) {

        console.error("Results error:", error);

        container.textContent =
            `Unable to load results: ${error.message}`;

        return;
    }


    if (!results || results.length === 0) {

        container.innerHTML =
            "<p>No completed Baylor games yet.</p>";

        return;
    }


    // --------------------------------------------------------
    // GROUP RESULTS BY GAME
    // --------------------------------------------------------

    const gameMap = new Map();

    results.forEach(function(result) {

        if (!gameMap.has(result.game_id)) {

            gameMap.set(result.game_id, {
                opponent: result.opponent,
                game_date: result.game_date,
                tipoff_time: result.tipoff_time,
                baylor_score: result.baylor_score,
                opponent_score: result.opponent_score,
                predictions: []
            });

        }

        gameMap.get(result.game_id).predictions.push(result);

    });


    // --------------------------------------------------------
    // DISPLAY GAMES
    // --------------------------------------------------------

    container.innerHTML = "";


    gameMap.forEach(function(game) {

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
            formatResultDate(game.game_date);

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
        // SORT PREDICTIONS BY POINTS
        // ----------------------------------------------------

        const scoredPredictions =
            game.predictions.sort(function(a, b) {

                return Number(b.points) - Number(a.points);

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

            const message =
                document.createElement("p");

            message.textContent =
                "No predictions available for this game.";

            details.appendChild(message);

        } else {

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


            scoredPredictions.forEach(function(prediction) {

                const row =
                    document.createElement("tr");


                const nameCell =
                    document.createElement("td");

                nameCell.textContent =
                    prediction.display_name;


                const probabilityCell =
                    document.createElement("td");

                probabilityCell.textContent =
                    `${Math.round(
                        Number(prediction.probability) * 100
                    )}%`;


                const pointsCell =
                    document.createElement("td");

                pointsCell.textContent =
                    Number(prediction.points).toFixed(2);


                row.appendChild(nameCell);
                row.appendChild(probabilityCell);
                row.appendChild(pointsCell);

                tbody.appendChild(row);

            });


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
