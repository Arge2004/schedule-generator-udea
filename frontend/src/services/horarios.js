import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getFacultades() {
  try {
    const { data } = await api.get('/facultades');
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener facultades');
    }
    return data.data;
  } catch (error) {
    console.error('Error en getFacultades:', error);
    throw error;
  }
}

export async function getProgramas(facultad) {
  try {
    const { data } = await api.get(`/programas/${facultad}`);
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener programas');
    }
    return data.data;
  } catch (error) {
    console.error('Error en getProgramas:', error);
    throw error;
  }
}

export async function getHorarios(facultad, programa, nombreFacultad, nombrePrograma) {
  try {
    const { data } = await api.get(`/horarios/${facultad}/${programa}`, {
      params: { nombreFacultad, nombrePrograma },
    });
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener horarios');
    }
    return data.data;
  } catch (error) {
    console.error('Error en getHorarios:', error);
    throw error;
  }
}

export async function generarHorarios(materias, codigosSeleccionados, opciones) {
  try {
    const { data } = await api.post('/generar-horarios', {
      materias,
      codigosSeleccionados,
      opciones
    });
    if (!data.success) {
      throw new Error(data.error || 'Error al generar horarios');
    }
    return data.data;
  } catch (error) {
    console.error('Error en generarHorarios:', error);
    throw error;
  }
}


