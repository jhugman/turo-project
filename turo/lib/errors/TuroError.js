export default class TuroError {
  constructor (errorMessage, node) {
    // deprecated, use errorCode.
    this.message = errorMessage;
    this.errorCode = errorMessage;
    this.node = node;
  }
}