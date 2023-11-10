window.addEventListener("load", () => {
  loadValues();
});

let scoreDict = {};

async function loadValues() {
  var { data, error } = await SUPABASE_CLIENT.from("team").select("*");
  if (error) {
    console.log(error);
    return;
  }
  console.log(data);
  for (let team of data) {
    let option = document.createElement("option");
    option.value = team.id;
    option.textContent = `${team.team_name} - ${
      team.color.charAt(0).toUpperCase() + team.color.slice(1)
    } Team`;
    document.getElementById("team").appendChild(option);
    scoreDict[team.id] = 0;
  }
  var { data, error } = await SUPABASE_CLIENT.from("team_score").select("*");
  for await (let score of data) {
    scoreDict[score.team_id] += score.score;
  }
  console.log(scoreDict);
}

document.getElementById("team").addEventListener("change", () => {
  updateScore();
});

const channels = SUPABASE_CLIENT.channel("custom-all-channel")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "team_score" },
    async (payload) => {
      console.log("Change received!", payload);
      updateScore();
    }
  )
  .subscribe();

async function updateScore() {
  for (let key of Object.keys(scoreDict)) {
    scoreDict[key] = 0;
  }
  var { data, error } = await SUPABASE_CLIENT.from("team_score").select("*");
  for await (let score of data) {
    scoreDict[score.team_id] += score.score;
  }
  document.getElementById("currentScore").innerText =
    scoreDict[document.getElementById("team").value];
}

let points = [1, 5, 10, 50];

for (let point of points) {
  let pointBtn = document.createElement("button");
  pointBtn.classList.add(
    "aspect-[3/2]",
    "rounded-md",
    "bg-indigo-600",
    "px-3.5",
    "py-2.5",
    "text-3xl",
    "font-bold",
    "text-white",
    "shadow-sm",
    "hover:bg-indigo-500",
    "focus-visible:outline",
    "focus-visible:outline-2",
    "focus-visible:outline-offset-2",
    "focus-visible:outline-indigo-600"
  );
  pointBtn.type = "button";
  pointBtn.textContent = `+${point}`;
  pointBtn.addEventListener("click", (e) => {
    e.preventDefault();
    addPoint(point);
  });
  let negativeBtn = pointBtn.cloneNode(true);
  negativeBtn.textContent = `-${point}`;
  negativeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    addPoint(-point);
  });
  document.getElementById("points").appendChild(negativeBtn);
  document.getElementById("points").appendChild(pointBtn);
}

async function addPoint(point) {
  let team_id = document.getElementById("team").value;
  if (document.getElementById("team").value) {
    let { data, error } = await SUPABASE_CLIENT.from("team_score").insert({
      team_id: team_id,
      score: point,
    });
  }
}
