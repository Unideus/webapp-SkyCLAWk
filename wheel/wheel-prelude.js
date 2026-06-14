/* Minimal host globals required by the shared wheel renderer. */
var timeState = {
  dateUTC: new Date(),
  navTargetDateUTC: null
};

window.timeState = timeState;
window.AstroEngine = {
  get dateUTC() {
    return timeState.dateUTC;
  },
  setDateUTC(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isFinite(date.getTime())) timeState.dateUTC = new Date(date.getTime());
  },
  get julianDay() {
    return this.dateUTC.getTime() / 86400000 + 2440587.5;
  },
  get T() {
    return (this.julianDay - 2451545.0) / 36525;
  }
};

window.syncEventShield = function () {};
window.requestWheelRedraw = function () {
  window.drawAstroWheel?.();
};
