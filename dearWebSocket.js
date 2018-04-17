const CLOSE_NORMAL_CODE = 1000;
const RECONNECT_INTERVAL = 1000;
const MAX_RECONNECT_ATTEMPTS = 5;

class DearWebSocket {
  constructor(
    url,
    protocols = [],
    reconnectInterval = RECONNECT_INTERVAL,
    maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS,
    autoOpen = true
  ) {
    // Read-only
    this.url = url;
    this.protocols = protocols;
    this.reconnectInterval = reconnectInterval;
    this.maxReconnectAttempts = maxReconnectAttempts;
    // Private
    this.reconnectAttempts = 0;
    if (autoOpen) this.open();

    return this;
  }

  open() {
    if (
      this.maxReconnectAttempts &&
      this.reconnectAttempts > this.maxReconnectAttempts
    ) {
      return;
    }

    this.instance = new WebSocket(this.url, this.protocols);
    this.instance.onopen = () => {
      this.reconnectAttempts = 0;
      this.onopen();
    };

    this.instance.onmessage = (response, flags) => {
      const data = JSON.parse(response.data);
      const body = JSON.parse(data.body);
      this.onmessage(data, flags, this.reconnectAttempts);
    };

    this.instance.onclose = response => {
      switch (response.code) {
        case CLOSE_NORMAL_CODE:
          console.log('WebSocket: closed');
          break;
        default:
          this.reconnect(response);
          break;
      }

      this.onclose(response);
    };

    this.instance.onerror = error => {
      switch (error.code) {
        case 'ECONNREFUSED':
          this.reconnect(error);
          break;
        default:
          this.onerror(error);
          break;
      }
    };
  }

  close(code = CLOSE_NORMAL_CODE, reason) {
    this.instance.close(code, reason);
  }

  send(data, option) {
    try {
      this.instance.send(data, option);
    } catch (e) {
      this.instance.emit('error', e);
    }
  }

  reconnect(e) {
    console.log(`WebSocketClient: retry in ${this.reconnectInterval}ms`, e);
    this.instance.removeAllListeners();
    const that = this;
    setTimeout(() => {
      console.log('WebSocketClient: reconnecting...');
      that.reconnectAttempts += 1;
      that.open(that.url);
    }, this.reconnectInterval);
  }

  onopen(...args) {
    console.log('WebSocketClient: open', ...args);
  }

  onerror(...args) {
    console.log('WebSocketClient: error', ...args);
  }

  onclose(...args) {
    console.log('WebSocketClient: closed', ...args);
  }

  onmessage(data, flags, number) {
    console.log('WebSocketClient: closed', data, flags, number);
  }
}
