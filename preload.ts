import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  file: {
    exists: (filePaths: string[]) => ipcRenderer.invoke('file:exists', filePaths),
    read: (filePath: string, options = {}) => ipcRenderer.invoke('file:read', filePath, options),
    write: (filePath: string, content: string, options = {}) => ipcRenderer.invoke('file:write', filePath, content, options),
    copy: (sourcePath: string, targetPath: string) => ipcRenderer.invoke('file:copy', sourcePath, targetPath),
    delete: (filePath: string) => ipcRenderer.invoke('file:delete', filePath)
  },
  dialog: {
    showOpen: (options = {}) => ipcRenderer.invoke('dialog:showOpen', options),
    showSave: (options = {}) => ipcRenderer.invoke('dialog:showSave', options),
    showMessage: (options = {}) => ipcRenderer.invoke('dialog:showMessage', options)
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getInfo: () => ipcRenderer.invoke('app:getInfo'),
    quit: () => ipcRenderer.invoke('app:quit'),
    restart: () => ipcRenderer.invoke('app:restart'),
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name)
  },
  on: (channel: string, callback: any) => ipcRenderer.on(channel, callback),
  off: (channel: string, callback: any) => ipcRenderer.off(channel, callback),
  once: (channel: string, callback: any) => ipcRenderer.once(channel, callback),
  chat: {
    sendMessage: (messages: any[]) => ipcRenderer.invoke('chat:sendMessage', messages),
    sendMessageStream: (messages: any[], onChunk?: (text: string) => void) => {
      const channel = `chat:stream:${Date.now()}`
      
      return new Promise((resolve, reject) => {
        const listener = (_event: any, data: any) => {
          if (data.type === 'chunk') {
            if (onChunk) onChunk(data.content || '')
          } else if (data.type === 'complete') {
            ipcRenderer.removeListener(channel, listener)
            resolve(data.result)
          } else if (data.type === 'error') {
            ipcRenderer.removeListener(channel, listener)
            reject(new Error(data.error))
          }
        }
        ipcRenderer.on(channel, listener)
        ipcRenderer.invoke('chat:sendMessageStream', channel, messages)
      })
    },
    getHistory: () => ipcRenderer.invoke('chat:getHistory'),
    clearHistory: () => ipcRenderer.invoke('chat:clearHistory'),
    webSearch: (query: string) => ipcRenderer.invoke('chat:webSearch', query)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
