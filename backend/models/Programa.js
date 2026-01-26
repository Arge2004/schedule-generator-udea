/**
 * Modelo que representa un programa académico
 */
class Programa {
  /**
   * @param {string} codigo - Código del programa
   * @param {string} nombre - Nombre del programa
   */
  constructor(codigo, nombre) {
    this.codigo = codigo;
    this.nombre = nombre;
  }

  /**
   * Crea una instancia de Programa desde un objeto plano
   * @param {Object} data - Objeto con los datos del programa
   * @returns {Programa}
   */
  static fromObject(data) {
    return new Programa(
      data.codigo || '',
      data.nombre || ''
    );
  }

  /**
   * Convierte la instancia a un objeto plano
   * @returns {Object}
   */
  toJSON() {
    return {
      codigo: this.codigo,
      nombre: this.nombre
    };
  }

  /**
   * Valida que el programa tenga los datos mínimos requeridos
   * @returns {boolean}
   */
  isValid() {
    return !!this.codigo && !!this.nombre;
  }
}

export default Programa;
