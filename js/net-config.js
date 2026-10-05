// Настройки сетевой игры.
// relay — адрес WebSocket-ретранслятора в Яндекс Облаке (см. yandex-relay/README.md), например:
//   'wss://d5dxxxxxxxxxxxxxxxxx.apigw.yandexcloud.net/ws'
// Пока адрес пустой, онлайн-игры работают через запасные каналы (PeerJS и MQTT).
window.CASINO_NET = {
  relay: 'wss://d5djjq0cti1lh07sgmr1.3rspsmhh.apigw.yandexcloud.net/ws',
};
