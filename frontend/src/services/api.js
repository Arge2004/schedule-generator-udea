const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Obtiene la lista de facultades disponibles
 * @returns {Promise<Array>} Lista de facultades
 */
export async function getFacultades() {
  try {
    const response = await fetch(`${API_URL}/api/facultades`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener facultades');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error en getFacultades:', error);
    throw error;
  }
}

/**
 * Obtiene la lista de programas para una facultad específica
 * @param {string} facultad - Valor de la facultad
 * @returns {Promise<Array>} Lista de programas
 */
export async function getProgramas(facultad) {
  try {
    const response = await fetch(`${API_URL}/api/programas/${facultad}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener programas');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error en getProgramas:', error);
    throw error;
  }
}

/**
 * Realiza el scraping de horarios
 * @param {string} facultad - Valor de la facultad
 * @param {string} programa - Valor del programa
 * @returns {Promise<string>} HTML con los horarios
 */
export async function scrapeHorarios(facultad, programa) {
  try {
    const response = await fetch(`${API_URL}/api/scrape-horarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ facultad, programa }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al hacer scraping');
    }
    
    return data.data.html;
  } catch (error) {
    console.error('Error en scrapeHorarios:', error);
    throw error;
  }
}
