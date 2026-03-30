const HIGH_SCORE_KEY = 'mj_highscore'

// Singleton: una sola instancia vive durante toda la sesión de juego.
// Cualquier escena lo importa directamente — no necesita pasarse como prop.
class ScoreManager {
  constructor () {
    this._score     = 0
    this._highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? '0', 10)
  }

  // --- API pública ---

  add (points) {
    this._score += points
    if (this._score > this._highScore) {
      this._highScore = this._score
      localStorage.setItem(HIGH_SCORE_KEY, this._highScore)
    }
    return this._score
  }

  reset () {
    this._score = 0
  }

  get score ()     { return this._score }
  get highScore () { return this._highScore }
}

// Exportamos la instancia, no la clase.
export const scoreManager = new ScoreManager()
