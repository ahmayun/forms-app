// document.addEventListener('DOMContentLoaded', () => {
    console.log("domcontentloaded")
    const { ipcRenderer } = require('electron');
    const settingsButton = document.getElementById('settingsButton');
    const savePathOption = document.getElementById('savePathOption');

    // Set Save Path Option
    savePathOption.addEventListener('click', async () => {
        const selectedPath = await ipcRenderer.invoke('select-save-path');
        if (selectedPath) {
        console.log(`Save path set to: ${selectedPath}`);
        }
    });



    const form = document.getElementById('user-form');
    
    if (form) {
      form.addEventListener('submit', async (event) => {
        console.log("submit pressed")
        event.preventDefault();
  
        const formData = {
            passType: document.getElementById('passType').value,
            date: document.getElementById('date').value,
            partyName: document.getElementById('partyName').value,
            address: document.getElementById('address').value,
            vehicleNo: document.getElementById('vehicleNo').value,
            driverName: document.getElementById('driverName').value,
            description: document.getElementById('description').value,
            weight: document.getElementById('weight').value,
          };
      

        await ipcRenderer.invoke('print-to-pdf', formData);
        // Clear the form fields after submission
        document.getElementById('user-form').reset();
      });
    } else {
      console.error("Form element not found!");
    }
//   });
  