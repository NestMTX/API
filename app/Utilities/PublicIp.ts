import axios from 'axios'

const sanitizeIp = (ip: string) => {
  // make sure that we're only returning 1 IP address
  const ips = ip.split('\n').filter((ip) => ip)
  ip = ips[0]
  const ips2 = ip.split(',').filter((ip) => ip)
  ip = ips2[0]
  return ip
}

export const fromGoogle = async () => {
  const { data } = await axios.get('https://domains.google.com/checkip')
  return sanitizeIp(data)
}

export const fromCloudflare = async () => {
  const { data } = await axios.get('https://www.cloudflare.com/cdn-cgi/trace')
  const ip = data.split('\n').find((line) => line.startsWith('ip='))
  if (!ip) {
    throw new Error('Unable to find ip in cloudflare response')
  }
  return sanitizeIp(ip.split('=')[1])
}

export const fromAws = async () => {
  const { data } = await axios.get('https://checkip.amazonaws.com')
  return sanitizeIp(data)
}

export const fromAkamai = async () => {
  const { data } = await axios.get('http://whatismyip.akamai.com')
  return sanitizeIp(data)
}

export const fromIpify = async () => {
  const { data } = await axios.get('https://api.ipify.org')
  return sanitizeIp(data)
}

export const fromIfconfigMe = async () => {
  const { data } = await axios.get('https://ifconfig.me')
  return sanitizeIp(data)
}

export const fromIpEchoNet = async () => {
  const { data } = await axios.get('https://ipecho.net/plain')
  return sanitizeIp(data)
}

export const fromIpInfoIo = async () => {
  const { data } = await axios.get('https://ipinfo.io/ip')
  return sanitizeIp(data)
}

export const fromHttpBin = async () => {
  const { data } = await axios.get('https://httpbin.org/ip')
  return sanitizeIp(data.origin)
}
