import SocketIOService from 'App/Services/SocketIO'
SocketIOService.boot()
const io = SocketIOService.io
export default io
