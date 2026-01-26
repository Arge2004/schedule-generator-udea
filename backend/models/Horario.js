/**
 * Modelo que representa un horario de clase
 */
class Horario {
  /**
   * @param {string|null} aula - Aula o salón donde se imparte la clase
   * @param {string[]} dias - Array de días (e.g., ["Lunes", "Miércoles"])
   * @param {string} diasAbrev - Días abreviados (e.g., "LW")
   * @param {number} horaInicio - Hora de inicio (formato 24h, e.g., 8)
   * @param {number} horaFin - Hora de finalización (formato 24h, e.g., 10)
   */
  constructor(aula, dias, diasAbrev, horaInicio, horaFin) {
    this.aula = aula;
    this.dias = dias;
    this.diasAbrev = diasAbrev;
    this.horaInicio = horaInicio;
    this.horaFin = horaFin;
  }

  /**
   * Crea una instancia de Horario desde un objeto plano
   * @param {Object} data - Objeto con los datos del horario
   * @returns {Horario}
   */
  static fromObject(data) {
    return new Horario(
      data.aula || null,
      data.dias || [],
      data.diasAbrev || '',
      data.horaInicio || 0,
      data.horaFin || 0
    );
  }

  /**
   * Convierte la instancia a un objeto plano
   * @returns {Object}
   */
  toJSON() {
    return {
      aula: this.aula,
      dias: this.dias,
      diasAbrev: this.diasAbrev,
      horaInicio: this.horaInicio,
      horaFin: this.horaFin
    };
  }

  /**
   * Valida que el horario tenga los datos mínimos requeridos
   * @returns {boolean}
   */
  isValid() {
    return (
      Array.isArray(this.dias) &&
      this.dias.length > 0 &&
      !!this.diasAbrev &&
      typeof this.horaInicio === 'number' &&
      typeof this.horaFin === 'number' &&
      this.horaInicio < this.horaFin &&
      this.horaInicio >= 6 &&
      this.horaFin <= 22
    );
  }

  /**
   * Verifica si este horario tiene conflicto con otro horario
   * @param {Horario} otroHorario - Otro horario para comparar
   * @returns {boolean}
   */
  tieneConflictoCon(otroHorario) {
    // Verificar si comparten al menos un día
    const compartenDia = this.dias.some(dia => otroHorario.dias.includes(dia));
    if (!compartenDia) return false;

    // Verificar si las horas se traslapan
    return !(this.horaFin <= otroHorario.horaInicio || this.horaInicio >= otroHorario.horaFin);
  }

  /**
   * Obtiene la duración del horario en horas
   * @returns {number}
   */
  getDuracion() {
    return this.horaFin - this.horaInicio;
  }
}

export default Horario;
