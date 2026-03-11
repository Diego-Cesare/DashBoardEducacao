const showTable = document.getElementById("showtable");
const tabela = document.getElementById("tabelaRegistros");
const excelBtn = document.getElementById("exportarExcel");

showTable.addEventListener("click", () => {
  tabela.classList.toggle("hidden");
  excelBtn.classList.toggle("hidden");
});
