/* Archivo: js/storage.js - VERSIÓN FINAL */

const SistemaMemoria = {
    
    // --- GESTIÓN DE LA RACHA ---
    obtenerRacha: function() {
        let racha = localStorage.getItem('racha_bomberos_huelva');
        return racha ? parseInt(racha) : 0;
    },

    sumarDia: function() {
        let rachaActual = this.obtenerRacha();
        rachaActual++; 
        localStorage.setItem('racha_bomberos_huelva', rachaActual);
        return rachaActual;
    },

    // --- GESTIÓN DE FALLOS: MODO ESTUDIO ---
    obtenerFallos: function() {
        let fallos = localStorage.getItem('fallos_bomberos_huelva');
        return fallos ? JSON.parse(fallos) : [];
    },

    registrarFallo: function(indicePregunta) {
        let fallos = this.obtenerFallos();
        if (!fallos.includes(indicePregunta)) {
            fallos.push(indicePregunta);
            localStorage.setItem('fallos_bomberos_huelva', JSON.stringify(fallos));
        }
    },

    registrarAcierto: function(indicePregunta) {
        let fallos = this.obtenerFallos();
        fallos = fallos.filter(numero => numero !== indicePregunta);
        localStorage.setItem('fallos_bomberos_huelva', JSON.stringify(fallos));
    },

    // --- GESTIÓN DE FALLOS: MODO RADAR ---
    obtenerFallosRadar: function() {
        let fallos = localStorage.getItem('fallos_radar_huelva');
        return fallos ? JSON.parse(fallos) : [];
    },

    registrarFalloRadar: function(nombreCarretera) {
        let fallos = this.obtenerFallosRadar();
        if (!fallos.includes(nombreCarretera)) {
            fallos.push(nombreCarretera);
            localStorage.setItem('fallos_radar_huelva', JSON.stringify(fallos));
        }
    },

    registrarAciertoRadar: function(nombreCarretera) {
        let fallos = this.obtenerFallosRadar();
        fallos = fallos.filter(nombre => nombre !== nombreCarretera);
        localStorage.setItem('fallos_radar_huelva', JSON.stringify(fallos));
    },

    // --- NUEVO: GESTIÓN DE TEMAS COMPLETADOS ---
    obtenerCompletados: function() {
        let completados = localStorage.getItem('temas_completados_huelva');
        return completados ? JSON.parse(completados) : [];
    },

    marcarComoCompletado: function(dia) {
        let completados = this.obtenerCompletados();
        if (!completados.includes(dia)) {
            completados.push(dia);
            localStorage.setItem('temas_completados_huelva', JSON.stringify(completados));
        }
    }
};