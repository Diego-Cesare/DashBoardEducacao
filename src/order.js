import { db } from "../firebase.js";

import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

let registros = [];

const tabela = document.getElementById("order-data");
const list = document.getElementById("add-unit");

/* =========================
   Carregar dados do Firebase
========================= */

onSnapshot(collection(db, "registros"), (snapshot) => {
  registros = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  renderSidebar();
  createTable();
});

/* =========================
   Renderizar tabela
========================= */

function createTable(requerente = null) {
  tabela.innerHTML = "";

  let dados = registros;

  if (requerente) {
    dados = registros.filter((r) => r.requerente === requerente);
  }

  dados
    .sort((a, b) => new Date(b.horaPedido) - new Date(a.horaPedido))
    .forEach((d) => {
      if (!d.requerente) return;

      const line = document.createElement("tr");

      if (d.enviado) {
        line.style.backgroundColor = "rgba(240, 10, 100, .3)";
      }

      line.innerHTML = `
        <td>${d.requerente || ""}</td>
        <td>${d.assunto || ""}</td>
        <td>${d.sobre || ""}</td>
        <td>${d.horaPedido ? formatarData(d.horaPedido) : ""}</td>
      `;

      const actionCell = document.createElement("td");

      /* BOTÃO WHATSAPP */
      const btnWhats = document.createElement("button");
      btnWhats.innerHTML = `<i class="ph ph-whatsapp-logo"></i>`;

      btnWhats.addEventListener("click", async () => {
        const mensagem = `
📌 Pedido de manutenção

Requerente: ${d.requerente}
Assunto: ${d.assunto}
Descrição: ${d.sobre}
Data: ${d.horaPedido ? formatarData(d.horaPedido) : ""}
        `;

        const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;

        window.open(url, "_blank");

        await updateDoc(doc(db, "registros", d.id), {
          enviado: true,
        });
      });

      /* BOTÃO EXCLUIR */
      const btnDelete = document.createElement("button");
      btnDelete.innerHTML = `<i class="ph ph-trash"></i>`;

      btnDelete.addEventListener("click", async () => {
        const confirmar = confirm("Deseja apagar este registro?");
        if (!confirmar) return;

        await deleteDoc(doc(db, "registros", d.id));
      });

      actionCell.appendChild(btnWhats);
      actionCell.appendChild(btnDelete);

      line.appendChild(actionCell);

      tabela.appendChild(line);
    });
}
const showAll = document.getElementById("show-all");

showAll.addEventListener("click", () => {
  document
    .querySelectorAll("#add-unit li")
    .forEach((li) => li.classList.remove("active"));

  createTable();
});

/* =========================
   Renderizar sidebar
========================= */

function renderSidebar() {
  list.innerHTML = "";

  const nomes = [
    ...new Set(registros.map((r) => r.requerente).filter(Boolean)),
  ];

  nomes.forEach((nome) => {
    const li = document.createElement("li");
    li.textContent = nome;

    li.addEventListener("click", () => {
      document
        .querySelectorAll("#add-unit li")
        .forEach((el) => el.classList.remove("active"));

      li.classList.add("active");

      createTable(nome);
    });

    list.appendChild(li);
  });
}

/* =========================
   Formatar data
========================= */

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
