class LocationChecker {
  static isOnGemPage() {
    return window.location.pathname.includes('/gem/');
  }
}