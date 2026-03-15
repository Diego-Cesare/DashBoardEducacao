const showTable = document.getElementById("showtable");
const tabela = document.getElementById("tabelaRegistros");
const excelBtn = document.getElementById("exportarExcel");

showTable.addEventListener("click", () => {
  tabela.classList.toggle("hidden");
  excelBtn.classList.toggle("hidden");
});

const kpi = document.querySelectorAll(".kpi");

kpi.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty("--x", x + "px");
    card.style.setProperty("--y", y + "px");
  });
});
