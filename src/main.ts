import * as core from '@actions/core'
import {Client, ConnectConfig} from 'ssh2'
import {
  checkDockerContainer,
  checkDockerImage,
  deleteDockerContainer,
  deleteDockerImage,
  pullDockerImage,
  startDockerImage,
  stopDockerContainer
} from './commands'

const argsMap = new Map([['PORT', 'p']])
function connect(options: ConnectConfig) {
  const conn = new Client()
  return new Promise<Client>((resolve, reject) => {
    conn
      .connect(options)
      .on('error', () => {
        reject('连接异常')
      })
      .on('close', () => {
        reject('连接关闭')
      })
      .on('ready', () => {
        resolve(conn)
      })
  })
}

// 启动
async function start(
  options: ConnectConfig,
  name: string,
  image: string,
  args: string = ''
) {
  const client = await connect(options)

  let container = await checkDockerContainer(client, name)
  if (container) {
    await stopDockerContainer(client, name)
    await deleteDockerContainer(client, name)
  }
  let imagecode = await checkDockerImage(client, image)
  if (imagecode) {
    imagecode = await deleteDockerImage(client, imagecode)
  }
  imagecode = await pullDockerImage(client, image)
  await startDockerImage(client, name, image, args)
}

async function run(): Promise<void> {
  try {
    const host = core.getInput('host') ?? ''
    const port = core.getInput('port') ?? ''
    const username = core.getInput('username')
    const password = core.getInput('password')
    const image = core.getInput('image')
    const name = core.getInput('name')
    const args = core.getInput('args') ?? ''
    if (!username) throw new Error('请输入用户名')
    if (!password) throw new Error('请输入密码')
    if (!host) throw new Error('请输入ip')
    if (!image) throw new Error('请输入镜像')
    if (!name) throw new Error('请输入容器名')
    if (!port) throw new Error('请输入端口')
    const hosts = host.split('\n')
    const _args = port.split('\n').reduce((a, b) => `${a} -p ${b}:${b}`, args)
    core.info(`IP: ${JSON.stringify(hosts)}`)
    core.info(`args: ${args}`)
    // Promise.all(
    //   hosts.map(item =>
    //     start(
    //       {
    //         host: item,
    //         username,
    //         password
    //       },
    //       name,
    //       image,
    //       code
    //     )
    //   )
    // ).catch(message => {
    //   core.setFailed(message.message)
    // })
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
