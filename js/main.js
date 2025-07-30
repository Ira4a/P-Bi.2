let chart;
document.getElementById("csvFile").addEventListener("change", function () {
  const file = this.files[0];
  Papa.parse(file, {
    header: true,
    complete: (results) => {
      const data = results.data;
      const fields = results.meta.fields;
      fillSelectors(fields);
      window.csvData = data;
    }
  });
});

function fillSelectors(fields) {
  const xSel = document.getElementById("xSelect");
  const ySel = document.getElementById("ySelect");
  xSel.innerHTML = "";
  ySel.innerHTML = "";
  fields.forEach(f => {
    xSel.innerHTML += `<option value="${f}">${f}</option>`;
    ySel.innerHTML += `<option value="${f}">${f}</option>`;
  });
}

function generateChart() {
  const xKey = document.getElementById("xSelect").value;
  const yKey = document.getElementById("ySelect").value;
  const chartType = document.getElementById("chartType").value;
  const labels = window.csvData.map(row => row[xKey]);
  const values = window.csvData.map(row => +row[yKey]);

  const ctx = document.getElementById("myChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: yKey,
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function saveChart() {
  const link = document.createElement('a');
  link.download = 'chart.png';
  link.href = document.getElementById('myChart').toDataURL();
  link.click();
}
