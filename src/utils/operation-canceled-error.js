export class OperationCanceledError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OperationCanceledError';
  }
}