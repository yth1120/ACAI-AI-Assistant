import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  })

  const htmlPath = path.join(__dirname, '..', 'dist-vue', 'index.html')

  mainWindow.loadFile(htmlPath).then(() => {
    mainWindow?.show()
  }).catch((err) => {
    console.error('加载失败:', err)
    mainWindow?.loadURL(`data:text/html,<h1>加载失败</h1><p>${err.message}</p>`)
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()
  createMenu()
  setupIpcHandlers()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

function createMenu(): void {
  const template = [
    {
      label: '文件',
      submenu: [
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectall', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: '关于 ACAI',
                message: 'ACAI v2.0.0',
                detail: '私人AI助手'
              })
            }
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template as any)
  Menu.setApplicationMenu(menu)
}

function setupIpcHandlers(): void {
  ipcMain.handle('app:getVersion', async () => app.getVersion())
  ipcMain.handle('app:getInfo', async () => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    isPackaged: app.isPackaged,
    userDataPath: app.getPath('userData')
  }))
  ipcMain.handle('app:quit', async () => { app.quit() })
  ipcMain.handle('app:restart', async () => { app.relaunch(); app.quit() })
  ipcMain.handle('app:getPath', async (_event, name: string) => {
    try {
      return app.getPath(name as any)
    } catch {
      return ''
    }
  })

  ipcMain.handle('dialog:showOpen', async (_event, options) => {
    const result = await dialog.showOpenDialog(mainWindow!, options)
    return result
  })

  ipcMain.handle('dialog:showSave', async (_event, options) => {
    const result = await dialog.showSaveDialog(mainWindow!, options)
    return result
  })

  ipcMain.handle('dialog:showMessage', async (_event, options) => {
    const result = await dialog.showMessageBox(mainWindow!, options)
    return { response: result.response }
  })

  ipcMain.handle('file:exists', async (_event, filePaths: string[]) => {
    const fs = require('fs/promises')
    return Promise.all(
      filePaths.map(async (filePath: string) => {
        try {
          await fs.access(filePath)
          return true
        } catch {
          return false
        }
      })
    )
  })

  ipcMain.handle('file:read', async (_event, filePath: string, options: any = {}) => {
    const fs = require('fs/promises')
    return fs.readFile(filePath, { encoding: options.encoding || 'utf-8' })
  })

  ipcMain.handle('file:write', async (_event, filePath: string, content: string) => {
    const fs = require('fs/promises')
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, 'utf-8')
    return { success: true }
  })

  ipcMain.handle('file:copy', async (_event, sourcePath: string, targetPath: string) => {
    try {
      const fs = require('fs/promises')
      await fs.mkdir(path.dirname(targetPath), { recursive: true })
      await fs.copyFile(sourcePath, targetPath)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('file:delete', async (_event, filePath: string) => {
    try {
      const fs = require('fs/promises')
      await fs.unlink(filePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('chat:sendMessage', async () => {
    return { content: '请在设置中配置API密钥' }
  })

  ipcMain.handle('chat:sendMessageStream', async (event, channel: string) => {
    event.sender.send(channel, { type: 'error', error: '请在设置中配置API密钥' })
  })

  ipcMain.handle('chat:getHistory', async () => [])
  ipcMain.handle('chat:clearHistory', async () => ({ success: true }))
  ipcMain.handle('chat:webSearch', async (_event, query: string) => {
    return { query, results: [] }
  })
}
