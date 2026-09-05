// ------------------------------------------------------------
// LOAD LEADERBOARD
// ------------------------------------------------------------

async function loadLeaderboard() {

    const user = await requireUser();

    if (!user) {
        return;
    }

    const container =
        document.getElementById(
            "leaderboard-container"
        );


    const {
        data: profiles,
        error
    } = await supabaseClient
        .from("profiles")
        .select("id, display_name")
        .order("display_name");


    if (error) {

        console.error(error);

        container.textContent =
            `Unable to load leaderboard: ${error.message}`;

        return;
    }


    if (!profiles || profiles.length === 0) {

        container.innerHTML =
            "<p>No contestants yet.</p>";

        return;
    }


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


    profiles.forEach(function(profile, index) {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${profile.display_name}</td>
            <td>—</td>
            <td>—</td>
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