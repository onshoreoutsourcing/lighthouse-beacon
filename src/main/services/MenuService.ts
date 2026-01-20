import { app, Menu, BrowserWindow } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';

/**
 * MenuService - Creates and manages the application menu
 *
 * Provides File, Edit, View, Window, and Help menus with relevant actions
 */
export class MenuService {
  /**
   * Creates and sets the application menu
   */
  public static createMenu(): void {
    const isMac = process.platform === 'darwin';

    const template: MenuItemConstructorOptions[] = [
      // App menu (macOS only)
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: 'about' as const },
                { type: 'separator' as const },
                { role: 'services' as const },
                { type: 'separator' as const },
                { role: 'hide' as const },
                { role: 'hideOthers' as const },
                { role: 'unhide' as const },
                { type: 'separator' as const },
                { role: 'quit' as const },
              ],
            },
          ]
        : []),

      // File menu
      {
        label: 'File',
        submenu: [
          {
            label: 'Open Folder...',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow) {
                focusedWindow.webContents.send('menu:open-folder');
              }
            },
          },
          {
            label: 'Open File...',
            accelerator: 'CmdOrCtrl+Shift+O',
            click: () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow) {
                focusedWindow.webContents.send('menu:open-file');
              }
            },
          },
          { type: 'separator' as const },
          {
            label: 'New File',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow) {
                focusedWindow.webContents.send('menu:new-file');
              }
            },
          },
          {
            label: 'New Folder',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow) {
                focusedWindow.webContents.send('menu:new-folder');
              }
            },
          },
          { type: 'separator' as const },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow) {
                focusedWindow.webContents.send('menu:save');
              }
            },
          },
          {
            label: 'Save As...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow) {
                focusedWindow.webContents.send('menu:save-as');
              }
            },
          },
          {
            label: 'Save All',
            accelerator: 'CmdOrCtrl+Alt+S',
            click: () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow) {
                focusedWindow.webContents.send('menu:save-all');
              }
            },
          },
          { type: 'separator' as const },
          {
            label: 'Close Folder',
            accelerator: 'CmdOrCtrl+K CmdOrCtrl+F',
            click: () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow) {
                focusedWindow.webContents.send('menu:close-folder');
              }
            },
          },
          {
            label: 'Close Window',
            accelerator: 'CmdOrCtrl+W',
            role: 'close' as const,
          },
          { type: 'separator' as const },
          ...(isMac
            ? []
            : [
                {
                  label: 'Exit',
                  accelerator: 'Alt+F4',
                  click: () => {
                    app.quit();
                  },
                },
              ]),
        ],
      },

      // Edit menu
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' as const },
          { role: 'redo' as const },
          { type: 'separator' as const },
          { role: 'cut' as const },
          { role: 'copy' as const },
          { role: 'paste' as const },
          { role: 'delete' as const },
          { type: 'separator' as const },
          { role: 'selectAll' as const },
        ],
      },

      // View menu
      {
        label: 'View',
        submenu: [
          { role: 'reload' as const },
          { role: 'forceReload' as const },
          { role: 'toggleDevTools' as const },
          { type: 'separator' as const },
          { role: 'resetZoom' as const },
          { role: 'zoomIn' as const },
          { role: 'zoomOut' as const },
          { type: 'separator' as const },
          { role: 'togglefullscreen' as const },
        ],
      },

      // Window menu
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' as const },
          { role: 'zoom' as const },
          ...(isMac
            ? [
                { type: 'separator' as const },
                { role: 'front' as const },
                { type: 'separator' as const },
                { role: 'window' as const },
              ]
            : [{ role: 'close' as const }]),
        ],
      },

      // Help menu
      {
        role: 'help' as const,
        submenu: [
          {
            label: 'Learn More',
            click: () => {
              void (async () => {
                const { shell } = await import('electron');
                await shell.openExternal('https://github.com/your-repo/lighthouse-beacon');
              })();
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}
