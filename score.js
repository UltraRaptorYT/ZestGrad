let graphData = [];

async function loadValues() {
  let { data, error } = await SUPABASE_CLIENT.from("team").select("*");
  if (error) {
    console.log(error);
    return;
  }
  console.log(data);
  barColors = data.map((e) => e.color);
  xValues = data.map((e) => e.team_name);
  for (let i = 0; i < data.length; i++) {
    graphData.push({
      id: data[i].id,
      x: data[i].team_name,
      y: 0,
      color: data[i].color,
    });
  }
  await getYValue();
}

async function getYValue() {
  for (let team of graphData) {
    team.y = 0;
  }
  let { data, error } = await SUPABASE_CLIENT.from("team_score").select("*");
  for await (let score of data) {
    graphData.filter((e) => {
      return e.id == score.team_id;
    })[0].y += score.score;
  }
}
var leaderboard;

function updateChart() {
  graphData.sort((a, b) => {
    return b.y - a.y;
  });
  leaderboard.data.labels = graphData.map((e, i) => {
    let add = "";
    if (e.y > 0) {
      if (i == 0) {
        add = " - 1st";
      } else if (i == 1) {
        add = " - 2nd";
      } else if (i == 2) {
        add = " - 3rd";
      }
    }
    return e.x + add;
  });
  leaderboard.data.datasets[0] = {
    backgroundColor: graphData.map((e) => e.color),
    data: graphData.map((e) => e.y),
  };
  leaderboard.update();
}

const channels = SUPABASE_CLIENT.channel("custom-all-channel")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "team_score" },
    async (payload) => {
      console.log("Change received!", payload);
      await getYValue();
      updateChart();
    }
  )
  .subscribe();

window.addEventListener("load", async () => {
  await loadValues();
  leaderboard = await new Chart("myChart", {
    type: "bar",
    plugins: [ChartDataLabels],
    options: {
      plugins: {
        // Change options for ALL labels of THIS CHART
        datalabels: {
          color: "black",
          font: {
            weight: "900",
            size: 18,
          },
          anchor: "end",
          align: "end",
        },
        legend: { display: false },
        title: {
          display: false,
        },
      },
      responsive: true,
      tooltips: {
        enabled: false,
        intersect: false,
      },
      scales: {
        x: {
          grid: { lineWidth: 2, color: "black", drawOnChartArea: false },
          ticks: { font: { size: 18, style: "bold" }, color: "black" },
        },
        y: {
          grid: { display: false, drawOnChartArea: false, drawBorder: false },
          ticks: { display: false },
          beginAtZero: true,
          min: 0,
        },
      },
      layout: {
        padding: 50,
      },
    },
  });
  updateChart();
});
