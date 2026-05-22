/**
 * Value Object — Coordenada geográfica com cálculo de distância.
 * Imutável após criação.
 */
export class GeoLocation {
  constructor(
    public readonly latitude: number,
    public readonly longitude: number,
  ) {
    if (latitude < -90 || latitude > 90) {
      throw new Error(`Latitude inválida: ${latitude}`);
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error(`Longitude inválida: ${longitude}`);
    }
  }

  /**
   * Calcula distância em metros usando a fórmula de Haversine.
   * Precisão suficiente para distâncias urbanas (< 50km).
   */
  distanceTo(other: GeoLocation): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = this.toRad(other.latitude - this.latitude);
    const dLng = this.toRad(other.longitude - this.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this.latitude)) *
        Math.cos(this.toRad(other.latitude)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Retorna distância formatada para exibição humana.
   */
  formattedDistanceTo(other: GeoLocation): string {
    const meters = this.distanceTo(other);
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
