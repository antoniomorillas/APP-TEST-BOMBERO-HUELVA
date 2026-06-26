/* Archivo: js/app.js - VERSIÓN FINAL CON SIMULACRO Y HARD RESET DE RACHA */

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');

    // --- NUEVO: HARD RESET EN LA INSIGNIA DE RACHA ---
    const btnResetRacha = document.getElementById('daily-streak');
    if (btnResetRacha) {
        btnResetRacha.style.cursor = 'pointer';
        btnResetRacha.title = 'Hacer clic para reiniciar todo el progreso';
        btnResetRacha.addEventListener('click', () => {
            const confirmar = confirm('⚠️ ALERTA DE BORRADO ⚠️\n\n¿Estás completamente seguro de que quieres borrar TODO tu historial de estudio, fallos y racha actual?\n\nEsta acción no se puede deshacer y empezarás de cero.');
            if (confirmar) {
                localStorage.clear(); // Borra absolutamente todo el almacenamiento local
                alert('Historial borrado. Ciclo reiniciado. ¡A por todas!');
                location.reload(); // Recarga la aplicación para aplicar los cambios
            }
        });
    }

    const mapaDiasATemas = {
        "1": ["1_Red_Troncal"], "2": ["2_Nacionales"], "3": ["3_Eje_Minero_A461"],
        "4": ["4_Eje_CostaEste_A494"], "5": ["5_Eje_Andevalo_A495"], "6": ["6_Frontera_A499_HU6400"],
        "7": ["7_Eje_Valverde_A496"], "8": ["8_Eje_Condado_A472"], "9": ["9_Eje_Rocio_A483"],
        "10": ["10_Ejes_Bonares_A484_A486"], "11": ["11_Vias_Forestales_y_Trampas"], "12": ["12_Orientacion_Norte_Sierra"],
        "13": ["13_Orientacion_Norte_Andevalo"], "14": ["14_Embalses_Costa_Andevalo"], "15": ["15_Embalses_Sierra_Minera"],
        "16": ["16_Rios_Principales"], "17": ["17_Pedanias_Sierra"], "18": ["18_Pedanias_Condado_Costa"],
        "19": ["19_Industria_y_Asentamientos"], "20": ["20_Minas_y_Estaciones"]
    };

    let temarioData = []; 
    let rutaEstudio = []; 
    let posicionEnRuta = 0;

    // --- VARIABLES GLOBALES DEL SIMULACRO ---
    let simulacroActivo = [];
    let preguntaSimActual = 0;
    let configSimActual = null;
    let respuestasUsuario = [];
    let timerInterval = null;
    let tiempoRestante = 0;

    function mostrarMenu() {
        const fallos = SistemaMemoria.obtenerFallos();
        const listaDias = [
            { id: "1", nombre: "Día 1: Red Troncal" }, { id: "2", nombre: "Día 2: Nacionales" },
            { id: "3", nombre: "Día 3: Eje Minero A-461" }, { id: "4", nombre: "Día 4: Eje Costa Este A-494" },
            { id: "5", nombre: "Día 5: Eje Andévalo A-495" }, { id: "6", nombre: "Día 6: Frontera A-499/HU-6400" },
            { id: "7", nombre: "Día 7: Eje Valverde A-496" }, { id: "8", nombre: "Día 8: Eje Condado A-472" },
            { id: "9", nombre: "Día 9: Eje Rocío A-483" }, { id: "10", nombre: "Día 10: Ejes Bonares A-484/A-486" },
            { id: "11", nombre: "Día 11: Vías Forestales y Trampas" }, { id: "12", nombre: "Día 12: Orientación Norte Sierra" },
            { id: "13", nombre: "Día 13: Orientación Norte Andévalo" }, { id: "14", nombre: "Día 14: Embalses Costa/Andévalo" },
            { id: "15", nombre: "Día 15: Embalses Sierra Minera" }, { id: "16", nombre: "Día 16: Ríos Principales" },
            { id: "17", nombre: "Día 17: Pedanías Sierra" }, { id: "18", nombre: "Día 18: Pedanías Condado/Costa" },
            { id: "19", nombre: "Día 19: Industria y Asentamientos" }, { id: "20", nombre: "Día 20: Minas y Estaciones" }
        ];

        let opcionesHtml = listaDias.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
        let btnFallos = fallos.length > 0 ? `<button id="btn-repaso" style="padding:15px; background:#d32f2f; color:white; border:none; border-radius:5px;">⚠️ Repasar ${fallos.length} fallos</button>` : '';

        appContainer.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h2 style="color: #d32f2f;">Centro de Mando</h2>
                <select id="selector-dias" style="width: 100%; padding: 10px; margin-bottom: 20px;">${opcionesHtml}</select>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button id="btn-teoria" style="padding: 15px;">📚 1. Píldoras de Teoría</button>
                    <button id="btn-estudio" style="padding: 15px;">📖 2. Modo Estudio</button>
                    ${btnFallos}
                    <button id="btn-test" style="padding: 15px;">📝 4. Simulacro de Test</button>
                </div>
            </div>
        `;

        document.getElementById('btn-teoria').onclick = () => cargarTeoria(document.getElementById('selector-dias').value);
        document.getElementById('btn-estudio').onclick = () => cargarTemario(document.getElementById('selector-dias').value);
        if(document.getElementById('btn-repaso')) document.getElementById('btn-repaso').onclick = () => cargarTemario("fallos");
        document.getElementById('btn-test').onclick = configurarSimulacro;
    }

    function cargarTeoria(diaId) {
        const temasBuscados = mapaDiasATemas[diaId] || [];
        appContainer.innerHTML = "Cargando...";
        fetch('data/temario.json')
            .then(r => r.json())
            .then(datos => {
                const filtrados = datos.filter(item => temasBuscados.includes(item.tema_id));
                let html = `<h2>📚 Apuntes Día ${diaId}</h2>`;
                filtrados.forEach(item => {
                    html += `<div style="background:white; padding:15px; margin-bottom:10px; border-left:4px solid #9C27B0;"><b>${item.pregunta}</b><br>${item.respuesta}<div style="margin-top:5px; color:#555; font-size:0.9rem;">💡 ${item.ayuda_memoristica || ''}</div></div>`;
                });
                html += `<button onclick="location.reload()" style="padding:10px;">⬅️ Volver</button>`;
                appContainer.innerHTML = html;
            });
    }

    function cargarTemario(diaId) {
        appContainer.innerHTML = `<div class="loading">Cargando...</div>`;
        fetch('data/temario.json')
            .then(r => r.json())
            .then(datos => {
                if (diaId === "fallos") {
                    const listaFallos = SistemaMemoria.obtenerFallos();
                    temarioData = datos.filter((_, index) => listaFallos.includes(index));
                    rutaEstudio = temarioData.map((_, i) => i);
                } else {
                    const temasBuscados = mapaDiasATemas[diaId] || [];
                    temarioData = datos.filter(item => temasBuscados.includes(item.tema_id));
                    rutaEstudio = temarioData.map((_, i) => i);
                }

                if (temarioData.length === 0) {
                    appContainer.innerHTML = "No hay tarjetas para este día. <button onclick='location.reload()'>Volver</button>";
                    return;
                }
                posicionEnRuta = 0;
                mostrarPregunta();
            });
    }

    function mostrarPregunta() {
        if (posicionEnRuta >= rutaEstudio.length) {
            appContainer.innerHTML = `<div style="text-align:center;"><h2>¡Completado! 🎉</h2><button onclick="location.reload()" style="padding:15px; cursor:pointer;">Volver al Menú</button></div>`;
            return;
        }
        const indiceReal = rutaEstudio[posicionEnRuta];
        const item = temarioData[indiceReal];
        
        appContainer.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #ccc;">
                <h3>${item.pregunta}</h3>
                <button id="btn-res" style="padding: 10px; background: #ff9800; color: white; cursor:pointer;">Ver Respuesta</button>
                <div id="res-div" style="display:none; margin-top:20px;">
                    <div style="font-size: 1.2rem; margin-bottom: 20px;"><b>${item.respuesta}</b></div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="btn-falle" style="padding: 10px 20px; background: #d32f2f; color: white; cursor:pointer;">❌ Fallé</button>
                        <button id="btn-acerte" style="padding: 10px 20px; background: #4CAF50; color: white; cursor:pointer;">✅ Lo sabía</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('btn-res').onclick = () => { document.getElementById('res-div').style.display = 'block'; document.getElementById('btn-res').style.display = 'none'; };
        document.getElementById('btn-falle').onclick = () => { SistemaMemoria.registrarFallo(indiceReal); posicionEnRuta++; mostrarPregunta(); };
        document.getElementById('btn-acerte').onclick = () => { SistemaMemoria.registrarAcierto(indiceReal); posicionEnRuta++; mostrarPregunta(); };
    }

    // --- PANEL DE CONFIGURACIÓN DE SIMULACRO ---
    function configurarSimulacro() {
        appContainer.innerHTML = `<div style="text-align:center; padding:20px;">Cargando base de datos...</div>`;
        
        fetch('data/tests.json')
            .then(r => r.json())
            .then(tests => {
                const temasCount = {};
                tests.forEach(q => {
                    const tema = q.tema_id || 'Tema General';
                    temasCount[tema] = (temasCount[tema] || 0) + 1;
                });

                const totalPreguntas = tests.length;

                let bloquesHtml = `
                    <label style="display:flex; align-items:center; padding:12px; background:#1e293b; margin-bottom:8px; border-radius:6px; cursor:pointer; border:1px solid #334155;">
                        <input type="checkbox" id="check-todos" checked style="margin-right:10px; transform:scale(1.2);">
                        <span style="color:#10b981; font-weight:bold; font-size:0.95rem;">Todos los bloques disponibles (${totalPreguntas} preguntas)</span>
                    </label>
                    <div id="lista-bloques" style="max-height:220px; overflow-y:auto; border:1px solid #334155; border-radius:6px; padding:8px; background:#0f172a;">
                `;

                for (const [tema, count] of Object.entries(temasCount)) {
                    bloquesHtml += `
                        <label style="display:flex; align-items:center; padding:10px; background:#1e293b; margin-bottom:5px; border-radius:4px; cursor:pointer; color:white; border:1px solid #334155;">
                            <input type="checkbox" class="check-bloque" value="${tema}" checked style="margin-right:10px;">
                            <span style="flex-grow:1; font-size:0.9rem;">${tema}</span> 
                            <span style="color:#94a3b8; font-size:0.8rem;">(${count} p.)</span>
                        </label>
                    `;
                }
                bloquesHtml += `</div>`;

                appContainer.innerHTML = `
                    <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 12px; text-align: left; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                        <h2 style="margin: 0 0 5px 0; color:white; font-size:1.4rem;">Configuración del Simulacro</h2>
                        <p style="color:#94a3b8; font-size:0.85rem; margin-bottom:25px;">Distribución matemática equitativa por Temas.</p>

                        <div style="margin-bottom: 20px;">
                            <label style="display:block; font-size:0.75rem; color:#cbd5e1; font-weight:bold; margin-bottom:8px; letter-spacing:0.5px;">1. MODO DE ESTUDIO</label>
                            <select id="sim-modo" style="width:100%; padding:12px; background:#020617; color:white; border:1px solid #10b981; border-radius:6px; outline:none; font-size:0.95rem;">
                                <option value="examen">Modo Examen (Resultados y justificaciones al terminar)</option>
                                <option value="practica">Modo Práctica (Retroalimentación inmediata en cada pregunta)</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display:block; font-size:0.75rem; color:#cbd5e1; font-weight:bold; margin-bottom:8px; letter-spacing:0.5px;">2. NÚMERO DE PREGUNTAS</label>
                            <div style="display:flex; justify-content:space-between; align-items:center; background:#020617; border:1px solid #334155; border-radius:6px; padding:10px 15px;">
                                <input type="number" id="sim-num" value="20" min="1" max="${totalPreguntas}" style="background:transparent; color:white; border:none; font-size:1.1rem; width:80px; outline:none; font-weight:bold;">
                                <span id="sim-disponibles" style="color:#94a3b8; font-size:0.85rem;">Disponibles: ${totalPreguntas}</span>
                            </div>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display:block; font-size:0.75rem; color:#cbd5e1; font-weight:bold; margin-bottom:8px; letter-spacing:0.5px;">3. GESTIÓN DE TIEMPO</label>
                            <select id="sim-tiempo" style="width:100%; padding:12px; background:#020617; color:white; border:1px solid #10b981; border-radius:6px; outline:none; font-size:0.95rem;">
                                <option value="60">1.0 min / pregunta (Simulación Oficial)</option>
                                <option value="45">45 seg / pregunta (Modo Presión Alta)</option>
                                <option value="0">Sin límite de tiempo de corte</option>
                            </select>
                        </div>

                        <div style="margin-bottom: 25px;">
                            <label style="display:block; font-size:0.75rem; color:#cbd5e1; font-weight:bold; margin-bottom:8px; letter-spacing:0.5px;">4. BLOQUES DIDÁCTICOS ACTIVOS</label>
                            ${bloquesHtml}
                        </div>

                        <button id="btn-iniciar-simulacro" style="width:100%; padding:16px; background:#10b981; color:#020617; font-weight:bold; font-size:1.1rem; border:none; border-radius:6px; cursor:pointer; transition: background 0.2s;">Comenzar Simulacro ▶</button>
                        <button onclick="location.reload()" style="width:100%; padding:12px; background:transparent; color:#ef4444; border:none; margin-top:10px; cursor:pointer; font-size:0.9rem;">Cancelar y volver al menú</button>
                    </div>
                `;

                const checkTodos = document.getElementById('check-todos');
                const checksBloques = document.querySelectorAll('.check-bloque');
                const spanDisponibles = document.getElementById('sim-disponibles');
                const inputNum = document.getElementById('sim-num');

                function actualizarContador() {
                    let activas = 0;
                    checksBloques.forEach(cb => { if(cb.checked) activas += temasCount[cb.value]; });
                    spanDisponibles.textContent = `Disponibles: ${activas}`;
                    inputNum.max = activas;
                    if(parseInt(inputNum.value) > activas) inputNum.value = activas || 1;
                    checkTodos.checked = Array.from(checksBloques).every(cb => cb.checked);
                }

                checkTodos.addEventListener('change', (e) => {
                    checksBloques.forEach(cb => cb.checked = e.target.checked);
                    actualizarContador();
                });

                checksBloques.forEach(cb => cb.addEventListener('change', actualizarContador));

                document.getElementById('btn-iniciar-simulacro').addEventListener('click', () => {
                    const temasSeleccionados = Array.from(checksBloques).filter(cb => cb.checked).map(cb => cb.value);
                    const cantidad = parseInt(inputNum.value);
                    
                    if(temasSeleccionados.length === 0 || isNaN(cantidad) || cantidad < 1) {
                        alert('⚠️ Selecciona al menos un bloque didáctico y 1 pregunta.');
                        return;
                    }

                    configSimActual = {
                        modo: document.getElementById('sim-modo').value,
                        numPreguntas: cantidad,
                        tiempoPorPregunta: parseInt(document.getElementById('sim-tiempo').value),
                        temas: temasSeleccionados
                    };

                    iniciarTestMotor(tests);
                });
            })
            .catch(err => {
                console.error(err);
                appContainer.innerHTML = `<div style="text-align:center; padding:20px;"><h2>Error</h2><p>No se encontró el archivo data/tests.json</p><button onclick="location.reload()" style="padding:10px;">Volver</button></div>`;
            });
    }

    // --- MOTOR DEL TEST ---
 function iniciarTestMotor(todosLosTests) {
        // 1. Obtenemos los fallos desde el localStorage (índices numéricos)
        const listaFallos = typeof SistemaMemoria !== 'undefined' ? SistemaMemoria.obtenerFallos() : [];
        
        // 2. Filtramos el conjunto total de tests según los temas elegidos
        let filtradas = todosLosTests.filter(q => configSimActual.temas.includes(q.tema_id || 'Tema General'));
        
        // 3. Identificamos los fallos usando el índice original (posición en todosLosTests)
        let preguntasFalladas = filtradas.filter(q => {
            let idx = todosLosTests.indexOf(q);
            return listaFallos.includes(idx);
        });
        
        // 4. El resto de preguntas que no están en la lista de fallos
        let preguntasResto = filtradas.filter(q => {
            let idx = todosLosTests.indexOf(q);
            return !listaFallos.includes(idx);
        });
        
        // 5. Barajamos aleatoriamente cada grupo por separado (algoritmo Fisher-Yates)
        [preguntasFalladas, preguntasResto].forEach(lista => {
            for (let i = lista.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [lista[i], lista[j]] = [lista[j], lista[i]];
            }
        });
        
        // 6. Unimos: primero las falladas, luego el resto, y cortamos al número deseado
        simulacroActivo = [...preguntasFalladas, ...preguntasResto].slice(0, configSimActual.numPreguntas);
        
        preguntaSimActual = 0;
        respuestasUsuario = [];

        if (configSimActual.tiempoPorPregunta > 0) {
            tiempoRestante = simulacroActivo.length * configSimActual.tiempoPorPregunta;
            iniciarCronometro();
        }

        mostrarPreguntaTest();
    }
    function iniciarCronometro() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            tiempoRestante--;
            const timerEl = document.getElementById('sim-timer');
            if(timerEl) {
                const min = Math.floor(tiempoRestante / 60);
                const sec = tiempoRestante % 60;
                timerEl.textContent = `⏱️ ${min}:${sec.toString().padStart(2, '0')}`;
                if(tiempoRestante <= 30) timerEl.style.color = '#ef4444'; // Rojo cuando quedan 30 segundos
            }
            if(tiempoRestante <= 0) {
                clearInterval(timerInterval);
                alert("¡Tiempo finalizado!");
                finalizarTest();
            }
        }, 1000);
    }

    function mostrarPreguntaTest() {
        if (preguntaSimActual >= simulacroActivo.length) {
            finalizarTest();
            return;
        }

        const q = simulacroActivo[preguntaSimActual];
        
        let htmlTop = `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#1e293b; color:white; padding:10px 15px; border-radius:8px 8px 0 0;">
                <span style="font-weight:bold; color:#10b981;">Pregunta ${preguntaSimActual + 1} / ${simulacroActivo.length}</span>
                ${configSimActual.tiempoPorPregunta > 0 ? `<span id="sim-timer" style="font-family:monospace; font-size:1.1rem;">⏱️ --:--</span>` : '<span>∞ Sin límite</span>'}
            </div>
            <div style="background:#0f172a; padding:20px; border-radius:0 0 8px 8px; color:white; border:1px solid #1e293b; min-height:300px;">
                <h3 style="margin-top:0; color:#e2e8f0; font-size:1.1rem; line-height:1.4;">${q.pregunta}</h3>
                <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;" id="contenedor-opciones">
        `;

        q.opciones.forEach((opt, idx) => {
            htmlTop += `<button class="btn-opcion" data-idx="${idx}" style="text-align:left; padding:12px 15px; background:#1e293b; color:#cbd5e1; border:1px solid #334155; border-radius:6px; cursor:pointer; font-size:0.95rem; transition:background 0.2s;">${opt}</button>`;
        });

        htmlTop += `</div>
            <div id="zona-feedback" style="margin-top:20px; display:none;"></div>
            <div style="display:flex; justify-content:space-between; margin-top:30px;">
                <button id="btn-terminar-test" style="padding:10px 15px; background:transparent; color:#ef4444; border:none; cursor:pointer;">Terminar Test</button>
                <div style="display:flex; gap:10px;">
                    <button id="btn-blanco" style="padding:10px 20px; background:#475569; color:white; border:none; border-radius:6px; cursor:pointer;">Dejar en blanco</button>
                    <button id="btn-sig-pregunta" style="padding:10px 20px; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer; display:none;">Siguiente ▶</button>
                </div>
            </div>
        </div>`;

        appContainer.innerHTML = htmlTop;

        // Vínculos de eventos a los botones (evita el fallo de scope)
        document.getElementById('btn-terminar-test').addEventListener('click', finalizarTest);
        
        const btnBlanco = document.getElementById('btn-blanco');
        const btnSig = document.getElementById('btn-sig-pregunta');
        const opcionesBtns = document.querySelectorAll('.btn-opcion');
        const feedbackDiv = document.getElementById('zona-feedback');

        function procesarRespuesta(idxSeleccionado) {
            opcionesBtns.forEach(b => b.disabled = true);
            btnBlanco.style.display = 'none';

            const esBlanco = idxSeleccionado === null;
            const esCorrecta = !esBlanco && idxSeleccionado === q.correcta;
            
            respuestasUsuario.push({
                pregunta: q.pregunta,
                seleccionada: esBlanco ? "En blanco" : q.opciones[idxSeleccionado],
                correcta: q.opciones[q.correcta],
                esCorrecto: esCorrecta,
                esBlanco: esBlanco,
                explicacion: q.explicacion
            });

            if (configSimActual.modo === 'practica') {
                opcionesBtns.forEach(b => {
                    const bIdx = parseInt(b.getAttribute('data-idx'));
                    if (bIdx === q.correcta) {
                        b.style.background = '#059669'; 
                        b.style.color = 'white';
                    } else if (!esBlanco && bIdx === idxSeleccionado) {
                        b.style.background = '#dc2626'; 
                        b.style.color = 'white';
                    } else {
                        b.style.opacity = '0.5';
                    }
                });

                feedbackDiv.style.display = 'block';
                let feedbackColor = esCorrecta ? '#10b981' : (esBlanco ? '#94a3b8' : '#dc2626');
                let feedbackBg = esCorrecta ? 'rgba(16,185,129,0.1)' : (esBlanco ? 'rgba(148,163,184,0.1)' : 'rgba(220,38,38,0.1)');
                let feedbackTexto = esCorrecta ? '¡Correcto!' : (esBlanco ? 'Dejada en blanco' : 'Fallo');

                feedbackDiv.innerHTML = `
                    <div style="padding:15px; background:${feedbackBg}; border-left:4px solid ${feedbackColor}; border-radius:4px;">
                        <b style="color:${feedbackColor}">${feedbackTexto}</b><br>
                        <span style="color:#cbd5e1; font-size:0.9rem;">${q.explicacion || 'Sin explicación disponible.'}</span>
                    </div>
                `;
                
                btnSig.style.display = 'block';
                btnSig.onclick = () => { preguntaSimActual++; mostrarPreguntaTest(); };

            } else {
                preguntaSimActual++;
                mostrarPreguntaTest();
            }
        }

        opcionesBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(btn.disabled) return;
                const idxSeleccionado = parseInt(e.target.getAttribute('data-idx'));
                procesarRespuesta(idxSeleccionado);
            });
        });

        btnBlanco.addEventListener('click', () => {
            procesarRespuesta(null);
        });
    }

    function finalizarTest() {
        clearInterval(timerInterval);
        
        const aciertos = respuestasUsuario.filter(r => r.esCorrecto).length;
        const fallos = respuestasUsuario.filter(r => !r.esCorrecto && !r.esBlanco).length;
        const total = configSimActual.numPreguntas;
        const totalEnBlanco = total - aciertos - fallos; 
        
        const nota = ((aciertos / total) * 10).toFixed(2);

        let htmlFinal = `
            <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 12px; text-align: center;">
                <h2 style="color:#10b981; margin-bottom:5px;">Resultados del Simulacro</h2>
                <div style="font-size:3rem; font-weight:bold; color:${nota >= 5 ? '#10b981' : '#ef4444'}; margin:20px 0;">${nota}</div>
                
                <div style="display:flex; justify-content:space-around; background:#1e293b; padding:15px; border-radius:8px; margin-bottom:30px;">
                    <div><span style="display:block; font-size:1.5rem; color:#10b981;">${aciertos}</span>Aciertos</div>
                    <div><span style="display:block; font-size:1.5rem; color:#ef4444;">${fallos}</span>Fallos</div>
                    <div><span style="display:block; font-size:1.5rem; color:#94a3b8;">${totalEnBlanco}</span>En blanco</div>
                </div>
        `;

        if (respuestasUsuario.length > 0) {
            htmlFinal += `<h3 style="text-align:left; color:#cbd5e1; border-bottom:1px solid #334155; padding-bottom:10px;">Revisión de respuestas</h3><div style="text-align:left;">`;
            respuestasUsuario.forEach((r, idx) => {
                let borderColor = r.esCorrecto ? '#10b981' : (r.esBlanco ? '#94a3b8' : '#ef4444');
                htmlFinal += `
                    <div style="background:#1e293b; padding:15px; margin-bottom:15px; border-left:4px solid ${borderColor}; border-radius:4px;">
                        <p style="margin-top:0; font-weight:bold; color:#f8fafc;">${idx+1}. ${r.pregunta}</p>
                        ${r.esBlanco ? `<p style="color:#94a3b8; margin:5px 0;">⚪ Tu respuesta: En blanco</p>` : (!r.esCorrecto ? `<p style="color:#ef4444; margin:5px 0;">❌ Tu respuesta: ${r.seleccionada}</p>` : '')}
                        <p style="color:#10b981; margin:5px 0;">✅ Correcta: ${r.correcta}</p>
                        <p style="color:#94a3b8; font-size:0.85rem; margin-top:10px; border-top:1px dashed #334155; padding-top:10px;"><i>Justificación: ${r.explicacion || 'N/A'}</i></p>
                    </div>
                `;
            });
            htmlFinal += `</div>`;
        }

        htmlFinal += `<button onclick="location.reload()" style="width:100%; padding:15px; background:#3b82f6; color:white; border:none; border-radius:6px; font-weight:bold; font-size:1.1rem; cursor:pointer; margin-top:20px;">Volver al Menú Principal</button></div>`;
        
        appContainer.innerHTML = htmlFinal;
    }

    mostrarMenu();
});