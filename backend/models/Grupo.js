import Horario from './Horario.js';

/**
 * Modelo que representa un grupo de una materia
 */
class Grupo {
  /**
   * @param {number} numero - Número del grupo
   * @param {number} cupoMaximo - Cupo máximo del grupo
   * @param {number} cupoDisponible - Cupos disponibles
   * @param {Horario[]} horarios - Array de horarios del grupo
   * @param {string|null} profesor - Nombre del profesor
   */
  constructor(numero, cupoMaximo, cupoDisponible, horarios, profesor) {
    this.numero = numero;
    this.cupoMaximo = cupoMaximo;
    this.cupoDisponible = cupoDisponible;
    this.horarios = horarios;
    this.profesor = profesor;
  }

  /**
   * Crea una instancia de Grupo desde un objeto plano
   * @param {Object} data - Objeto con los datos del grupo
   * @returns {Grupo}
   */
  static fromObject(data) {
    const horarios = (data.horarios || []).map(h => 
      h instanceof Horario ? h : Horario.fromObject(h)
    );

    return new Grupo(
      data.numero,
      data.cupoMaximo || 0,
      data.cupoDisponible || 0,
      horarios,
      data.profesor || null
    );
  }

  /**
   * Convierte la instancia a un objeto plano
   * @returns {Object}
   */
  toJSON() {
    return {
      numero: this.numero,
      cupoMaximo: this.cupoMaximo,
      cupoDisponible: this.cupoDisponible,
      horarios: this.horarios.map(h => h.toJSON()),
      profesor: this.profesor
    };
  }

  /**
   * Valida que el grupo tenga los datos mínimos requeridos
   * @returns {boolean}
   */
  isValid() {
    return (
      (typeof this.numero === 'number' || typeof this.numero === 'string') &&
      typeof this.cupoMaximo === 'number' &&
      typeof this.cupoDisponible === 'number' &&
      Array.isArray(this.horarios) &&
      this.horarios.length > 0 &&
      this.horarios.every(h => h.isValid())
    );
  }

  /**
   * Verifica si el grupo tiene cupos disponibles
   * @returns {boolean}
   */
  tieneCuposDisponibles() {
    return this.cupoDisponible > 0;
  }

  /**
   * Verifica si este grupo tiene conflicto de horario con otro grupo
   * @param {Grupo} otroGrupo - Otro grupo para comparar
   * @returns {boolean}
   */
  tieneConflictoCon(otroGrupo) {
    for (const horario of this.horarios) {
      for (const otroHorario of otroGrupo.horarios) {
        if (horario.tieneConflictoCon(otroHorario)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Obtiene todos los días de la semana en que el grupo tiene clases
   * @returns {string[]} Array de días únicos
   */
  getDiasConClase() {
    const diasSet = new Set();
    this.horarios.forEach(h => {
      h.dias.forEach(dia => diasSet.add(dia));
    });
    return Array.from(diasSet);
  }
}

export default Grupo;
