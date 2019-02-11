const Migration = require('./migration')

module.exports = class extends Migration {
  async up () {
    console.log('skipping since in firestore')
  }
}
