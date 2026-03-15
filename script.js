import { db } from "./firebase.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

let registros = [];

let chartUnidades;
let chartEquipes;
let chartTipos;
let chartMes;

const filtroUnidade = document.getElementById("filtro-unidade");
const filtroEquipe = document.getElementById("filtro-equipe");
const dataInicio = document.getElementById("data-inicio");
const dataFim = document.getElementById("data-fim");

// Theme: default follows system; button sets manual override (persisted).
const THEME_STORAGE_KEY = "dashboard-theme"; // "light" | "dark" | "system"
const systemThemeMql = window.matchMedia("(prefers-color-scheme: dark)");

function getSystemTheme() {
  return systemThemeMql.matches ? "dark" : "light";
}

function setStoredThemeMode(mode) {
  if (mode === "system") localStorage.removeItem(THEME_STORAGE_KEY);
  else localStorage.setItem(THEME_STORAGE_KEY, mode);
}

function applyThemeMode(mode) {
  if (mode === "light" || mode === "dark") {
    document.documentElement.setAttribute("data-theme", mode);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  updateThemeToggleLabel(mode);
}

function getEffectiveTheme(mode) {
  return mode === "system" ? getSystemTheme() : mode;
}

const cores = [
  "#ef476f",
  "#ffd166",
  "#00afb5",
  "#218380",
  "#7161ef",
  "#7c99b4",
  "#be95c4",
];

function contar(lista, campo) {
  const cont = {};

  lista.forEach((r) => {
    let valor;

    if (campo === "unidade") {
      valor = r.unidade || r.requerente;
    } else {
      valor = r[campo];
    }

    if (!valor) return;

    cont[valor] = (cont[valor] || 0) + 1;
  });

  return cont;
}

function obterStatus(total) {
  if (total >= 31) return "Nivel: Alto";
  if (total >= 11) return "Nivel: Medio";
  return "Nivel: Baixo";
}

function adicionarEquipeNum() {
  const equipes = ["Eduardo", "Everaldo", "Andre", "Rui"];

  equipes.forEach((nome) => {
    const total = registros.filter((r) => r.equipe === nome).length;

    const numEl = document.getElementById(`${nome.toLowerCase()}-num`);
    const statusEl = document.getElementById(`${nome.toLowerCase()}-status`);

    if (numEl) {
      numEl.textContent = `Manutenções ${total}`;
    }

    if (statusEl) {
      statusEl.textContent = obterStatus(total);
      statusEl.style.color = cores[2];
    }
  });
}

function aplicarFiltros() {
  let dados = [...registros];

  if (filtroUnidade.value) {
    dados = dados.filter((r) => r.unidade === filtroUnidade.value);
  }
  if (filtroEquipe.value) {
    dados = dados.filter((r) => r.equipe === filtroEquipe.value);
  }

  if (dataInicio.value) {
    dados = dados.filter(
      (r) => new Date(r.criadoEm) >= new Date(dataInicio.value),
    );
  }

  if (dataFim.value) {
    dados = dados.filter(
      (r) => new Date(r.criadoEm) <= new Date(dataFim.value),
    );
  }

  return dados;
}

function atualizarKPIs(lista) {
  const normalizar = (v) => (v || "").toString().trim().toLowerCase();

  document.getElementById("totalManut").textContent = lista.length;

  document.getElementById("totalUnidades").textContent = new Set(
    lista.map((r) => normalizar(r.unidade)),
  ).size;

  document.getElementById("totalEquipes").textContent = new Set(
    lista.map((r) => normalizar(r.equipe)),
  ).size;

  document.getElementById("totalTipos").textContent = new Set(
    lista.map((r) => normalizar(r.tipo)),
  ).size;
}
function gerarGrafico(canvas, dados, chart) {
  const labels = Object.keys(dados);
  const values = Object.values(dados);

  if (chart) chart.destroy();

  return new Chart(canvas, {
    type: "doughnut",

    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: cores,
          borderWidth: 1,
        },
      ],
    },

    options: {
      responsive: true,
      spacing: 0,

      layout: {
        padding: {
          top: 0,
          left: 0,
          right: 0,
        },
      },

      plugins: {
        legend: {
          position: "left",
          display: false,
          labels: {
            boxWidth: 10,
            padding: 10,
            font: {
              size: 12,
              family: "Arial",
              weight: "100",
            },
          },
        },
      },

      cutout: "60%",
    },
  });
}

function evolucaoMensal(lista) {
  const meses = {};

  lista.forEach((r) => {
    if (!r.criadoEm) return;

    const data = new Date(r.criadoEm);

    const chave =
      data.getFullYear() + "-" + String(data.getMonth() + 1).padStart(2, "0");

    meses[chave] = (meses[chave] || 0) + 1;
  });

  return meses;
}

function atualizarDashboard() {
  const filtrados = aplicarFiltros();

  atualizarKPIs(filtrados);

  chartUnidades = gerarGrafico(
    document.getElementById("graficoUnidades"),
    contar(filtrados, "unidade"),
    chartUnidades,
  );

  chartEquipes = gerarGrafico(
    document.getElementById("graficoEquipes"),
    contar(filtrados, "equipe"),
    chartEquipes,
  );

  chartTipos = gerarGrafico(
    document.getElementById("graficoTipos"),
    contar(filtrados, "tipo"),
    chartTipos,
  );

  chartMes = gerarGrafico(
    document.getElementById("graficoMes"),
    evolucaoMensal(filtrados),
    chartMes,
  );
  filtrarTabela(filtrados);
}

function carregarUnidades() {
  const unidades = [
    ...new Set(registros.map((r) => r.unidade).filter(Boolean)),
  ];

  unidades.forEach((u) => {
    const op = document.createElement("option");
    op.value = u;
    op.textContent = u;

    filtroUnidade.appendChild(op);
  });
}

function carregarEquipes() {
  const equipes = [...new Set(registros.map((r) => r.equipe).filter(Boolean))];

  equipes.forEach((u) => {
    const op = document.createElement("option");
    op.value = u;
    op.textContent = u;

    filtroEquipe.appendChild(op);
  });
}

onSnapshot(collection(db, "registros"), (snapshot) => {
  registros = [];

  snapshot.forEach((doc) => {
    const dados = doc.data();

    if (!dados) return;

    // ignora registros completamente vazios
    if (!dados.unidade && !dados.equipe && !dados.tipo) return;

    registros.push(dados);
  });

  if (filtroUnidade.options.length === 1) carregarUnidades();
  if (filtroEquipe.options.length === 1) carregarEquipes();

  atualizarDashboard();
  adicionarEquipeNum();
});

function formatarData(dataISO) {
  const data = new Date(dataISO);

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function carregarTabela() {
  const tabela = document.getElementById("dados");

  const q = query(
    collection(db, "registros"),
    orderBy("criadoEm", "desc"), // mais recente primeiro
  );

  const querySnapshot = await getDocs(q);
  tabela.innerHTML = "";

  querySnapshot.forEach((doc) => {
    const dados = doc.data();

    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${dados.unidade || ""}</td>
      <td>${dados.equipe || ""}</td>
      <td>${dados.tipo || ""}</td>
      <td>${dados.descricao || ""}</td>
      <td>${dados.criadoEm ? formatarData(dados.criadoEm) : ""}</td>
    `;

    tabela.appendChild(linha);
  });
}

carregarTabela();

function filtrarTabela(lista) {
  const tabela = document.getElementById("dados");

  tabela.innerHTML = "";

  lista.forEach((dados) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${dados.unidade || ""}</td>
      <td>${dados.equipe || ""}</td>
      <td>${dados.tipo || ""}</td>
      <td>${dados.descricao || ""}</td>
      <td>${dados.criadoEm ? formatarData(dados.criadoEm) : ""}</td>
    `;

    tabela.appendChild(linha);
  });
}

document
  .getElementById("btnFiltrar")
  .addEventListener("click", atualizarDashboard);

const btnExportar = document.getElementById("exportarExcel");

btnExportar.addEventListener("click", () => {
  const tabela = document.getElementById("tabelaRegistros");

  const workbook = XLSX.utils.table_to_book(tabela, {
    sheet: "Manutencoes",
  });

  XLSX.writeFile(workbook, "manutencoes.xlsx");
});
