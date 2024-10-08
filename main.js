import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import Store from 'electron-store';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const store = new Store(); // For persistent storage
function createWindow() {

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      contextIsolation: false, // Allows use of require in the renderer
      nodeIntegration: true, // Allows Node.js modules in renderer
    },
  });

  win.loadFile('index.html');

  // Handle save path selection
    ipcMain.handle('select-save-path', async () => {
        const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
        });
    
        if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        store.set('savePath', selectedPath); // Save the path to persistent storage
        return selectedPath;
        }
        return null;
    });

  ipcMain.handle('print-to-pdf', async (event, formData) => {
    console.log("handling ipc")
    try {


      const now = new Date();
      const serialNumber = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      // Get the save path from persistent storage
      let savePath = store.get('savePath');
      if (!savePath) {
      // Default to the current directory if no path is set
        savePath = path.join(__dirname, 'generated-forms');
      }

      const pdfWindow = new BrowserWindow({ show: false });
      await pdfWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(`
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header, .footer {
            text-align: center;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header h2 {
            margin: 0;
            font-size: 18px;
          }
          .header h3 {
            margin: 0;
            font-size: 16px;
          }
          .content table {
            width: 100%;
            margin-bottom: 20px;
          }
          .content table, .content th, .content td {
            border: 1px solid black;
            border-collapse: collapse;
          }
          .content th, .content td {
            padding: 8px;
            text-align: left;
          }
          .content th {
            background-color: #f2f2f2;
          }
          .signature {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          .signature div {
            text-align: center;
            width: 200px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AA Paper (Pvt) Ltd</h1>
          <h2>NTN: 3789794-2</h2>
          <h3>5km Sharaqpur Road, Sheikhupura</h3>
          <h3>Gate ${formData.passType} Pass</h3>
        </div>

        <div class="content">
          <table>
            <tr>
              <th>Date:</th>
              <td>${new Date().toLocaleDateString()}</td>
              <th>Sr No:</th>
              <td colspan="2">${serialNumber}</td>
            </tr>
            <tr>
              <th>Party Name:</th>
              <td colspan="3">${formData.partyName}</td>
            </tr>
            <tr>
              <th>Address:</th>
              <td colspan="3">${formData.address}</td>
            </tr>
            <tr>
              <th>Vehicle No:</th>
              <td>${formData.vehicleNo}</td>
              <th>Driver Name:</th>
              <td colspan="3">${formData.driverName}</td>
            </tr>
          </table>

          <table>
            <tr>
              <th>Description</th>
              <th>Weight</th>
            </tr>
            <tr>
              <td>${formData.description}</td>
              <td>${formData.weight}</td>
            </tr>
          </table>
        </div>

        <div class="signature">
          <div>
            <hr>
            <p>Dispatch Officer</p>
          </div>
          <div>
            <hr>
            <p>Gate Security</p>
          </div>
        </div>
      </body>
      </html>
    `)}`);
  
      // Check if the directory exists, and if not, create it
      if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath, { recursive: true });
      }

      const pdfPath = path.join(savePath, `form_${formData.passType.toLowerCase()}_${serialNumber}.pdf`);
      const pdf = await pdfWindow.webContents.printToPDF({});
      fs.writeFileSync(pdfPath, pdf);
  
      dialog.showMessageBox({
        message: `PDF successfully saved to ${pdfPath}`,
        buttons: ['OK'],
      });
  
      pdfWindow.close();
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      dialog.showErrorBox("Error", `Failed to generate PDF: ${error.message}`);
    }
  });
  
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
