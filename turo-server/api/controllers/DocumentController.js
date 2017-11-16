const Controller = require('trails/controller')
const exampleDoc = '';

module.exports = class DocumentController extends Controller {
  home (request, reply) {
    reply(exampleDoc)
  }

  create (request, reply) {
  }

  helloWorld (request, reply) {
    reply('Hello Trails.js !')
  }
}
