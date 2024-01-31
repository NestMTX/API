declare module '@ioc:MQTT/Client' {
  import type { Client } from 'mqtt'
  const client: typeof Client
  export default client
}

declare module '@ioc:Socket.IO/Broadcast/GUI' {
  const broadcast: (event: string, ...args: any[]) => void
  export default broadcast
}

declare module '@ioc:Socket.IO/Broadcast/API' {
  const broadcast: (event: string, ...args: any[]) => void
  export default broadcast
}

declare module '@ioc:Socket.IO/Broadcast' {
  const broadcast: (event: string, ...args: any[]) => void
  export default broadcast
}
