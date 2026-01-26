import Grupo from './Grupo.js';

/**
 * Modelo que representa una materia del programa académico
 */
class Materia {
  /**
   * @param {string} codigo - Código de la materia
   * @param {string} nombre - Nombre de la materia
   * @param {Grupo[]} grupos - Array de grupos disponibles
   */
  constructor(codigo, nombre, grupos) {
    this.codigo = codigo;
    this.nombre = nombre;
    this.grupos = grupos;
  }

  /**
   * Crea una instancia de Materia desde un objeto plano
   * @param {Object} data - Objeto con los datos de la materia
   * @returns {Materia}
   */
  static fromObject(data) {
    const grupos = (data.grupos || []).map(g => 
      g instanceof Grupo ? g : Grupo.fromObject(g)
    );

    return new Materia(
      data.codigo || '',
      data.nombre || '',
      grupos
    );
  }

  /**
   * Convierte la instancia a un objeto plano
   * @returns {Object}
   */
  toJSON() {
    return {
      codigo: this.codigo,
      nombre: this.nombre,
      grupos: this.grupos.map(g => g.toJSON())
    };
  }

  /**
   * Valida que la materia tenga los datos mínimos requeridos
   * @returns {boolean}
   */
  isValid() {
    return (
      !!this.codigo &&
      !!this.nombre &&
      Array.isArray(this.grupos) &&
      this.grupos.length > 0 &&
      this.grupos.every(g => g.isValid())
    );
  }

  /**
   * Obtiene un grupo específico por su número
   * @param {number} numeroGrupo - Número del grupo a buscar
   * @returns {Grupo|null}
   */
  getGrupoPorNumero(numeroGrupo) {
    return this.grupos.find(g => g.numero === numeroGrupo) || null;
  }

  /**
   * Obtiene todos los grupos con cupos disponibles
   * @returns {Grupo[]}
   */
  getGruposConCupo() {
    return this.grupos.filter(g => g.tieneCuposDisponibles());
  }

  /**
   * Cuenta el total de grupos disponibles
   * @returns {number}
   */
  getCantidadGrupos() {
    return this.grupos.length;
  }

  /**
   * Verifica si la materia tiene al menos un grupo con cupos
   * @returns {boolean}
   */
  tieneGruposDisponibles() {
    return this.grupos.some(g => g.tieneCuposDisponibles());
  }
}

export default Materia;
