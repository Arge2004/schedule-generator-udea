import Programa from './Programa.js';
import Materia from './Materia.js';

/**
 * Modelo que representa la respuesta completa del parsing del HTML
 * Contiene toda la información de facultad, programa, semestre y materias
 */
class DatosCompletos {
  /**
   * @param {string} facultad - Nombre de la facultad
   * @param {Programa} programa - Información del programa académico
   * @param {string} semestre - Semestre académico (e.g., "2026-1")
   * @param {string} fecha - Fecha de consulta
   * @param {Materia[]} materias - Array de materias disponibles
   */
  constructor(facultad, programa, semestre, fecha, materias) {
    this.facultad = facultad;
    this.programa = programa;
    this.semestre = semestre;
    this.fecha = fecha;
    this.materias = materias;
  }

  /**
   * Crea una instancia de DatosCompletos desde un objeto plano
   * @param {Object} data - Objeto con los datos completos
   * @returns {DatosCompletos}
   */
  static fromObject(data) {
    const programa = data.programa instanceof Programa 
      ? data.programa 
      : Programa.fromObject(data.programa || {});

    const materias = (data.materias || []).map(m => 
      m instanceof Materia ? m : Materia.fromObject(m)
    );

    return new DatosCompletos(
      data.facultad || '',
      programa,
      data.semestre || '',
      data.fecha || '',
      materias
    );
  }

  /**
   * Convierte la instancia a un objeto plano
   * @returns {Object}
   */
  toJSON() {
    return {
      facultad: this.facultad,
      programa: this.programa.toJSON(),
      semestre: this.semestre,
      fecha: this.fecha,
      materias: this.materias.map(m => m.toJSON())
    };
  }

  /**
   * Valida que los datos completos sean válidos
   * @returns {boolean}
   */
  isValid() {
    return (
      !!this.facultad &&
      this.programa.isValid() &&
      !!this.semestre &&
      !!this.fecha &&
      Array.isArray(this.materias) &&
      this.materias.length > 0 &&
      this.materias.every(m => m.isValid())
    );
  }

  /**
   * Obtiene una materia por su código
   * @param {string} codigo - Código de la materia
   * @returns {Materia|null}
   */
  getMateriaPorCodigo(codigo) {
    return this.materias.find(m => m.codigo === codigo) || null;
  }

  /**
   * Obtiene todas las materias con grupos disponibles
   * @returns {Materia[]}
   */
  getMateriasConGruposDisponibles() {
    return this.materias.filter(m => m.tieneGruposDisponibles());
  }

  /**
   * Cuenta el total de materias
   * @returns {number}
   */
  getCantidadMaterias() {
    return this.materias.length;
  }

  /**
   * Obtiene un resumen de la información general
   * @returns {Object}
   */
  getResumen() {
    return {
      facultad: this.facultad,
      programa: this.programa.toJSON(),
      semestre: this.semestre,
      fecha: this.fecha,
      totalMaterias: this.getCantidadMaterias(),
      materiasConCupo: this.getMateriasConGruposDisponibles().length
    };
  }
}

export default DatosCompletos;
