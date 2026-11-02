async function loadLeaderboard() {
    const user = await requireUser();
    if (!user) return;

    const container = document.getElementById("leaderboard-container");

    // Load leaderboard totals
    const { data: leaderboard, error } = await supabaseClient
        .from("leaderboard")
        .select("*");

    if (error) {
        console.error("Leaderboard error:", error);
        container.textContent =
            `Unable to load leaderboard: ${error.message}`;
        return;
    }

    if (!leaderboard || leaderboard.length === 0) {
        container.innerHTML =
            "<p>No completed games have been scored yet.</p>";
        return;
    }

    // Load completed games
    const { data: games, error: gamesError } = await supabaseClient
        .from("games")
        .select("*")
        .eq("status", "final")
        .order("tipoff_time", { ascending: false });

    if (gamesError) {
        console.error("Games error:", gamesError);
        container.textContent =
            `Unable to load games: ${gamesError.message}`;
        return;
    }

    // Load contestant profiles
    const { data: profiles, error: profilesError } = await supabaseClient
        .from("profiles")
        .select("id, display_name");

    if (profilesError) {
        console.error("Profiles error:", profilesError);
        container.textContent =
            `Unable to load contestant names: ${profilesError.message}`;
        return;
    }

    // Load predictions for completed games.
    // Do not filter by user_locked: unlocked predictions count too.
    const gameIds = games.map(game => game.id);

    let predictions = [];

    if (gameIds.length > 0) {
        const { data, error: predictionsError } = await supabaseClient
            .from("predictions")
            .select("game_id, user_id, probability")
            .in("game_id", gameIds);

        if (predictionsError) {
            console.error("Predictions error:", predictionsError);
            container.textContent =
                `Unable to load predictions: ${predictionsError.message}`;
            return;
        }

        predictions = data || [];
    }

    // Match profile IDs to display names
    const profileMap = new Map();

    profiles.forEach(function(profile) {
        profileMap.set(
            profile.id.toLowerCase(),
            profile.display_name
        );
    });

    // Match games to predictions
    const gameMap = new Map(
        games.map(game => [game.id, game])
    );

    // Create leaderboard table
    const table = document.createElement("table");
    table.className = "leaderboard-table";

    table.innerHTML = `
        <thead>
            <tr>
                <th>Rank</th>
                <th>Contestant</th>
                <th>Points</th>
                <th>Games</th>
                <th>Avg. Points/Game</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    leaderboard.forEach(function(entry, index) {

        // Main leaderboard row
        const row = document.createElement("tr");

        const rankCell = document.createElement("td");
        rankCell.textContent = index + 1;

        const nameCell = document.createElement("td");
        nameCell.textContent = entry.display_name;

        const pointsCell = document.createElement("td");
        pointsCell.textContent =
            Number(entry.total_points).toFixed(2);

        const gamesCell = document.createElement("td");
        gamesCell.textContent = entry.games;

        const averagePoints = Number(entry.games) > 0
            ? Number(entry.total_points) / Number(entry.games)
            : 0;

        const averageCell = document.createElement("td");
        averageCell.textContent = averagePoints.toFixed(2);

        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(pointsCell);
        row.appendChild(gamesCell);
        row.appendChild(averageCell);

        tbody.appendChild(row);

        // Find this contestant's predictions
        const userId = profiles.find(
            profile => profile.display_name === entry.display_name
        )?.id;

        const contestantPredictions = predictions
            .filter(prediction =>
                prediction.user_id.toLowerCase() === userId?.toLowerCase()
            )
            .sort((a, b) => {
                const gameA = gameMap.get(a.game_id);
                const gameB = gameMap.get(b.game_id);

                return new Date(gameB.tipoff_time) -
                    new Date(gameA.tipoff_time);
            });

        // Create expandable game-by-game section
        const detailRow = document.createElement("tr");

        const detailCell = document.createElement("td");
        detailCell.colSpan = 5;

        const details = document.createElement("details");
        details.className = "leaderboard-details";

        const summary = document.createElement("summary");
        summary.textContent = "View game-by-game results";

        details.appendChild(summary);

        if (contestantPredictions.length === 0) {

            const message = document.createElement("p");
            message.textContent = "No game predictions available.";

            details.appendChild(message);

        } else {

            const detailTable = document.createElement("table");
            detailTable.className = "leaderboard-table";

            detailTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Game</th>
                        <th>Score</th>
                        <th>Baylor Win Probability</th>
                        <th>Points</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const detailBody = detailTable.querySelector("tbody");

            contestantPredictions.forEach(function(prediction) {

                const game = gameMap.get(prediction.game_id);

                if (!game) return;

                const actualOutcome =
                    game.baylor_score > game.opponent_score ? 1 : 0;

                const probability = Number(prediction.probability);

                const points =
                    100 * (1 - Math.pow(probability - actualOutcome, 2));

                const gameRow = document.createElement("tr");

                const opponentCell = document.createElement("td");
                opponentCell.textContent =
                    `Baylor vs. ${game.opponent}`;

                const scoreCell = document.createElement("td");
                scoreCell.textContent =
                    `${game.baylor_score} - ${game.opponent_score}`;

                const probabilityCell = document.createElement("td");
                probabilityCell.textContent =
                    `${(probability * 100).toFixed(0)}%`;

                const pointsCell = document.createElement("td");
                pointsCell.textContent = points.toFixed(2);

                gameRow.appendChild(opponentCell);
                gameRow.appendChild(scoreCell);
                gameRow.appendChild(probabilityCell);
                gameRow.appendChild(pointsCell);

                detailBody.appendChild(gameRow);
            });

            details.appendChild(detailTable);
        }

        detailCell.appendChild(details);
        detailRow.appendChild(detailCell);
        tbody.appendChild(detailRow);
    });

    container.innerHTML = "";
    container.appendChild(table);
}

loadLeaderboard();