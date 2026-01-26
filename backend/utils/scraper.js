/**
 * Utilidades para hacer scraping de la página de horarios de la UdeA
 * sin usar navegador headless (scraping simple con HTTP requests)
 */

/**
 * Carga el HTML inicial de la página de consulta de horarios
 * @returns {Promise<string>} HTML de la página
 */
async function cargarPaginaInicial() {
  const url = 'https://ayudame2.udea.edu.co/php_mares/do.php?app=pub_cuposprog';
  
  try {
    const response = await fetch(url, {
        method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    return html;

  } catch (error) {
    throw new Error(`Error al cargar la página inicial: ${error.message}`);
  }
}

/**
 * Obtiene el script de facultades que contiene el array con todas las facultades
 * @returns {Promise<string>} Contenido del script facultades.php
 */
async function cargarScriptFacultades() {
  const url = 'https://ayudame2.udea.edu.co/php_mares/facultades.php';
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://ayudame2.udea.edu.co/php_mares/do.php?app=pub_cuposprog',
        'Connection': 'keep-alive'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Obtener el contenido como buffer
    const buffer = await response.arrayBuffer();
    
    // Decodificar desde ISO-8859-1 (Latin1) a UTF-8
    const decoder = new TextDecoder('iso-8859-1');
    const script = decoder.decode(buffer);
    
    return script;

  } catch (error) {
    throw new Error(`Error al cargar facultades.php: ${error.message}`);
  }
}

/**
 * Obtiene el script de programas para una facultad específica
 * @param {string} facultadId - ID de la facultad
 * @returns {Promise<string>} Contenido del script programas.php
 */
async function cargarScriptProgramas(facultadId) {
  const url = `https://ayudame2.udea.edu.co/php_mares/programas.php?facultad=${facultadId}&first=Seleccione`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://ayudame2.udea.edu.co/php_mares/do.php?app=pub_cuposprog',
        'Connection': 'keep-alive'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Obtener el contenido como buffer
    const buffer = await response.arrayBuffer();
    
    // Decodificar desde ISO-8859-1 (Latin1) a UTF-8
    const decoder = new TextDecoder('iso-8859-1');
    const script = decoder.decode(buffer);
    
    return script;

  } catch (error) {
    throw new Error(`Error al cargar programas.php: ${error.message}`);
  }
}

/**
 * Obtiene el HTML con los horarios de un programa específico
 * @param {string} facultadId - ID de la facultad
 * @param {string} programaId - ID del programa
 * @param {string} nombreFacultad - Nombre completo de la facultad
 * @param {string} nombrePrograma - Nombre completo del programa (con código)
 * @returns {Promise<string>} HTML con la tabla de horarios
 */
async function obtenerHorariosHTML(facultadId, programaId, nombreFacultad, nombrePrograma) {
  const url = 'https://ayudame2.udea.edu.co/php_mares/do.php?app=pub_cuposprog';
  
  try {
    // Primero hacer GET para establecer sesión y obtener cookies
    const sessionResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Connection': 'keep-alive'
      }
    });
    
    const htmlInicial = await sessionResponse.text();
    
    // Extraer cookies del response
    const cookies = sessionResponse.headers.get('set-cookie');
    
    // Extraer numrand del HTML
    const numrandMatch = htmlInicial.match(/name="numrand"\s+value="(\d+)"/);
    const numrand = numrandMatch ? numrandMatch[1] : Math.floor(Math.random() * 10000);
    
    // Preparar datos del formulario
    const formData = new URLSearchParams({
      'Facultad': facultadId,
      'Programa': programaId,
      'NombreFacultad': nombreFacultad,
      'NombrePrograma': nombrePrograma,
      'numrand': numrand,
      'Parametros': ''
    });
    
    const postHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'https://ayudame2.udea.edu.co',
      'Referer': 'https://ayudame2.udea.edu.co/php_mares/do.php?app=pub_cuposprog',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
    
    // Agregar cookies si las hay
    if (cookies) {
      postHeaders['Cookie'] = cookies;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: postHeaders,
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Obtener el contenido como buffer y decodificar
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('iso-8859-1');
    const html = decoder.decode(buffer);
    
    return html;

  } catch (error) {
    throw new Error(`Error al obtener horarios: ${error.message}`);
  }
}

export {
  cargarPaginaInicial,
  cargarScriptFacultades,
  cargarScriptProgramas,
  obtenerHorariosHTML
};
