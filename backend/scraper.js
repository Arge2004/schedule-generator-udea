import { chromium } from 'playwright';

/**
 * Realiza scraping de la página de horarios de la Universidad de Antioquia
 * @param {string} facultad - Valor de la facultad seleccionada
 * @param {string} programa - Valor del programa seleccionado
 * @returns {Promise<string>} HTML con los horarios
 */
export async function scrapeHorarios(facultad, programa) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    // Navegar a la página principal
    await page.goto('https://ayudame2.udea.edu.co/php_mares/do.php?app=pub_cuposprog', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Página cargada, esperando selectores...');

    // Esperar a que cargue el selector de facultad
    await page.waitForSelector('select[name="Facultad"]', { timeout: 10000 });

    // Seleccionar facultad
    await page.selectOption('select[name="Facultad"]', facultad);
    console.log(`Facultad seleccionada: ${facultad}`);

    // Esperar a que se habilite el selector de programa
    await page.waitForFunction(
      () => !document.querySelector('select[name="Programa"]').disabled,
      { timeout: 10000 }
    );

    // Esperar un momento para que cargue completamente
    await page.waitForTimeout(500);

    // Seleccionar programa
    await page.selectOption('select[name="Programa"]', programa);
    console.log(`Programa seleccionado: ${programa}`);

    // Esperar a que se habilite el botón enviar
    await page.waitForFunction(
      () => !document.querySelector('input[name="cmdEnviar"]').disabled,
      { timeout: 10000 }
    );

    // Click en el botón enviar
    await page.click('input[name="cmdEnviar"]');
    console.log('Botón enviar clickeado');

    // Esperar a que cargue la nueva página con los horarios
    // Podemos esperar por un selector específico de la tabla de horarios
    await page.waitForSelector('table', { timeout: 15000 });
    
    // Esperar un poco más para asegurar que todo el contenido dinámico se cargue
    await page.waitForTimeout(2000);

    // Obtener el HTML completo de la página resultante
    const html = await page.content();
    
    console.log('HTML obtenido exitosamente');

    return html;

  } catch (error) {
    console.error('Error durante el scraping:', error);
    throw new Error(`Error al hacer scraping: ${error.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Obtiene la lista de facultades disponibles
 * @returns {Promise<Array>} Lista de facultades
 */
export async function getFacultades() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    await page.goto('https://ayudame2.udea.edu.co/php_mares/do.php?app=pub_cuposprog', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForSelector('select[name="Facultad"]', { timeout: 10000 });

    // Extraer opciones del selector
    const facultades = await page.evaluate(() => {
      const select = document.querySelector('select[name="Facultad"]');
      const options = Array.from(select.options);
      return options
        .filter(opt => opt.value !== '0')
        .map(opt => ({
          value: opt.value,
          label: opt.textContent.trim()
        }));
    });

    return facultades;

  } catch (error) {
    console.error('Error obteniendo facultades:', error);
    throw new Error(`Error al obtener facultades: ${error.message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Obtiene la lista de programas para una facultad específica
 * @param {string} facultad - Valor de la facultad
 * @returns {Promise<Array>} Lista de programas
 */
export async function getProgramas(facultad) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    await page.goto('https://ayudame2.udea.edu.co/php_mares/do.php?app=pub_cuposprog', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForSelector('select[name="Facultad"]', { timeout: 10000 });

    // Seleccionar facultad
    await page.selectOption('select[name="Facultad"]', facultad);

    // Esperar a que se carguen los programas
    await page.waitForFunction(
      () => !document.querySelector('select[name="Programa"]').disabled,
      { timeout: 10000 }
    );

    await page.waitForTimeout(500);

    // Extraer opciones del selector de programas
    const programas = await page.evaluate(() => {
      const select = document.querySelector('select[name="Programa"]');
      const options = Array.from(select.options);
      return options
        .filter(opt => opt.value !== '0' && opt.value !== '')
        .map(opt => ({
          value: opt.value,
          label: opt.textContent.trim()
        }));
    });

    return programas;

  } catch (error) {
    console.error('Error obteniendo programas:', error);
    throw new Error(`Error al obtener programas: ${error.message}`);
  } finally {
    await browser.close();
  }
}
