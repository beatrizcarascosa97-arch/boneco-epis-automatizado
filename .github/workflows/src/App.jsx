import React, { useEffect, useState } from "react";

export default function App() {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("ppe_items_v1");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const [nome, setNome] = useState("");
  const [intervalo, setIntervalo] = useState(30);
  const [dataTroca, setDataTroca] = useState(() => new Date().toISOString().slice(0, 10));
  const [filter, setFilter] = useState("");

  useEffect(() => {
    localStorage.setItem("ppe_items_v1", JSON.stringify(items));
  }, [items]);

  function diasEntre(dataString) {
    const hoje = new Date();
    const d = new Date(dataString + "T00:00:00");
    const diff = Math.floor((hoje - d) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  }

  function adicionar() {
    if (!nome) return alert("Informe o nome do EPI.");
    const novo = {
      id: Date.now(),
      nome,
      intervalo: Number(intervalo),
      dataTroca,
      criadoEm: new Date().toISOString(),
    };
    setItems([novo, ...items]);
    setNome("");
    setIntervalo(30);
    setDataTroca(new Date().toISOString().slice(0, 10));
  }

  function remover(id) {
    if (!confirm("Remover este registro?")) return;
    setItems(items.filter((it) => it.id !== id));
  }

  function atualizarTroca(id) {
    const hoje = new Date().toISOString().slice(0, 10);
    setItems(items.map((it) => (it.id === id ? { ...it, dataTroca: hoje } : it)));
  }

  function exportar() {
    const data = JSON.stringify(items, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ppe_items_export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importar(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        } else {
          alert("Arquivo inválido: esperado array JSON.");
        }
      } catch (err) {
        alert("Erro ao importar: " + err.message);
      }
    };
    reader.readAsText(f);
  }

  async function pedirNotificacao() {
    if (!("Notification" in window)) return alert("Notificações não suportadas neste navegador.");
    if (Notification.permission === "granted") return alert("Notificações já permitidas.");
    const perm = await Notification.requestPermission();
    if (perm === "granted") alert("Permissão concedida. O navegador poderá alertar sobre EPIs vencidos.");
  }

  function checarNotificar() {
    if (Notification.permission !== "granted") return;
    items.forEach((it) => {
      const dias = diasEntre(it.dataTroca);
      const restante = it.intervalo - dias;
      if (restante <= 0) {
        new Notification(`EPI vencido: ${it.nome}`, {
          body: `Trocar agora — última troca: ${it.dataTroca}`,
        });
      } else if (restante <= 3) {
        new Notification(`EPI perto do vencimento: ${it.nome}`, {
          body: `${restante} dia(s) restantes (últ: ${it.dataTroca})`,
        });
      }
    });
  }

  useEffect(() => {
    const t = setTimeout(checarNotificar, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function colorByStatus(item) {
    const dias = diasEntre(item.dataTroca);
    const restante = item.intervalo - dias;
    if (restante <= 0) return "red";
    if (restante <= Math.ceil(item.intervalo * 0.2)) return "yellow";
    return "green";
  }

  function BonecoSVG({ cor }) {
    const fill = cor === "green" ? "#16a34a" : cor === "yellow" ? "#f59e0b" : "#dc2626";
    return (
      <svg width="120" height="180" viewBox="0 0 140 220" xmlns="http://www.w3.org/2000/svg">
        <circle cx="70" cy="40" r="26" fill="#fce7d8" stroke="#333" strokeWidth="1" />
        <rect x="35" y="70" rx="12" ry="12" width="70" height="90" fill={fill} stroke="#222" strokeWidth="2" />
        <rect x="8" y="78" width="24" height="12" rx="6" fill={fill} stroke="#222" strokeWidth="2" />
        <rect x="108" y="78" width="24" height="12" rx="6" fill={fill} stroke="#222" strokeWidth="2" />
        <rect x="45" y="162" width="16" height="44" rx="6" fill="#111827" />
        <rect x="79" y="162" width="16" height="44" rx="6" fill="#111827" />
        <circle cx="60" cy="36" r="3" fill="#111" />
        <circle cx="80" cy="36" r="3" fill="#111" />
      </svg>
    );
  }

  const listaFiltrada = items.filter((it) => it.nome.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">Boneco de Troca de EPIs</h2>
          <p className="text-sm text-gray-600 text-center">Registre EPIs, configure intervalo e veja quando trocar.</p>

          <div className="w-full p-3 bg-gray-100 rounded-lg">
            <label className="block text-xs font-medium">Nome do EPI</label>
            <input className="w-full p-2 rounded mt-1 border" value={nome} onChange={(e) => setNome(e.target.value)} />
            <label className="block text-xs font-medium mt-2">Intervalo (dias)</label>
            <input type="number" className="w-full p-2 rounded mt-1 border" value={intervalo} onChange={(e) => setIntervalo(e.target.value)} />
            <label className="block text-xs font-medium mt-2">Data da última troca</label>
            <input type="date" className="w-full p-2 rounded mt-1 border" value={dataTroca} onChange={(e) => setDataTroca(e.target.value)} />
            <div className="flex gap-2 mt-3">
              <button onClick={adicionar} className="flex-1 py-2 rounded bg-sky-600 text-white">Adicionar</button>
              <button onClick={pedirNotificacao} className="py-2 px-3 rounded border">Notificações</button>
            </div>
          </div>

          <div className="w-full text-xs text-gray-600">
            <p className="mb-2">Exportar / Importar</p>
            <div className="flex gap-2">
              <button onClick={exportar} className="px-3 py-2 rounded border">Exportar JSON</button>
              <label className="px-3 py-2 rounded border cursor-pointer">
                Importar
                <input onChange={importar} type="file" accept="application/json" className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <input placeholder="Filtrar por nome" value={filter} onChange={(e) => setFilter(e.target.value)} className="p-2 border rounded w-64" />
            </div>
            <div className="text-sm text-gray-600">Registros: {items.length}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listaFiltrada.length === 0 && (
              <div className="p-6 border rounded text-center text-gray-500">Nenhum EPI cadastrado ainda.</div>
            )}

            {listaFiltrada.map((it) => {
              const dias = diasEntre(it.dataTroca);
              const restante = it.intervalo - dias;
              const cor = colorByStatus(it);
              return (
                <div key={it.id} className="p-4 border rounded flex gap-4 items-center">
                  <div>
                    <BonecoSVG cor={cor} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{it.nome}</div>
                        <div className="text-xs text-gray-500">Última troca: {it.dataTroca}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{restante <= 0 ? "VENCIDO" : `${restante} dia(s)`}</div>
                        <div className="text-xs text-gray-500">Intervalo: {it.intervalo}d</div>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button onClick={() => atualizarTroca(it.id)} className="px-3 py-1 rounded bg-emerald-500 text-white text-sm">Registrar troca hoje</button>
                      <button onClick={() => remover(it.id)} className="px-3 py-1 rounded border text-sm">Remover</button>
                    </div>

                    <div className="mt-2 text-xs">Status: <span className={`font-semibold ${cor === 'green' ? 'text-green-600' : cor === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>{cor.toUpperCase()}</span></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-sm text-gray-500">
            Dica: ajuste o intervalo para cada EPI — por exemplo: luvas descartáveis (1 dia), respiradores com uso contínuo (30-90 dias) ou capacetes (inspeção visual periódica). Este componente usa dias desde a última troca; adapte para horas de uso ou número de utilidades se necessário.
          </div>
        </div>
      </div>
    </div>
  );
}
