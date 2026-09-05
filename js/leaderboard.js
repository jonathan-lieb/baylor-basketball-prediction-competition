// ------------------------------------------------------------
// LOAD LEADERBOARD
// ------------------------------------------------------------

async function loadLeaderboard() {

    const user = await requireUser();

    if (!user) {
        return;
    }

    const container =
        document.getElementById("leaderboard-container");


    // --------------------------------------------------------
    // GET LEADERBOARD
    // --------------------------------------------------------

    const {
        data: leaderboard,
        error
    } = await supabaseClient
        .from("leaderboard")
        .select("*");


    if (error) {

        console.error("Leaderboard error:", error);

        container.textContent =
            `Unable to load leaderboard: ${error.message}`;

        return;
    }


    // --------------------------------------------------------
    // NO SCORES YET
    // --------------------------------------------------------

    if (!leaderboard || leaderboard.length === 0) {

        container.innerHTML =
            "<p>No completed games have been scored yet.</p>";

        return;
    }


    // --------------------------------------------------------
    // CREATE TABLE
    // --------------------------------------------------------

    const table =
        document.createElement("table");

    table.className =
        "leaderboard-table";


    table.innerHTML = `
        <thead>
            <tr>
                <th>Rank</th>
                <th>Contestant</th>
                <th>Points</th>
                <th>Games</th>
            </tr>
        </thead>

        <tbody></tbody>
    `;


    const tbody =
        table.querySelector("tbody");


    // --------------------------------------------------------
    // ADD CONTESTANTS
    // --------------------------------------------------------

    leaderboard.forEach(function(entry, index) {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.display_name}</td>
            <td>${Number(entry.total_points).toFixed(2)}</td>
            <td>${entry.games}</td>
        `;


        tbody.appendChild(row);

    });


    container.innerHTML = "";

    container.appendChild(table);
}


// ------------------------------------------------------------
// START
// ------------------------------------------------------------

loadLeaderboard();