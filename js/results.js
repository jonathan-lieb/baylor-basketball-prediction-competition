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
        error
    } = await supabaseClient
        .from("games")
        .select("*")
        .eq("status", "final")
        .order("tipoff_time", {
            ascending: false
        });


    if (error) {

        console.error(error);

        container.textContent =
            `Unable to load results: ${error.message}`;

        return;
    }


    // --------------------------------------------------------
    // NO COMPLETED GAMES
    // --------------------------------------------------------

    if (!games || games.length === 0) {

        container.innerHTML =
            "<p>No completed Baylor games yet.</p>";

        return;
    }


    // --------------------------------------------------------
    // DISPLAY GAMES
    // --------------------------------------------------------

    container.innerHTML = "";


    games.forEach(function(game) {

        const card =
            document.createElement("div");

        card.className =
            "game-card";


        // Opponent

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