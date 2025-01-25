/******************** Manage Sensor ********************/


async function manageSensor(action) {
  try {
      // Get input values
      const macAddress = document.getElementById('mac_address').value.trim();
      const deviceName = document.getElementById('device_name').value.trim();
      const location = document.getElementById('location').value.trim();

      // Validate inputs
      if (!macAddress) {
          alert("MAC Address is required.");
          return;
      }

      let url = `/devices`;
      let method;
      let body = null;

      // Determine action
      if (action === 'add') {
          if (!deviceName || !location) {
              alert("Device Name and Location are required to add a sensor.");
              return;
          }
          method = 'POST';
          body = JSON.stringify({ mac_address: macAddress, device_name: deviceName, location: location });
      } else if (action === 'rename') {
          if (!deviceName || !location) {
              alert("Device Name and Location are required to rename a sensor.");
              return;
          }
          method = 'PUT';
          body = JSON.stringify({ mac_address: macAddress, device_name: deviceName, location: location });
      } else if (action === 'remove') {
          method = 'DELETE';
          body = JSON.stringify({ mac_address: macAddress });
      } else {
          console.error("Unknown action:", action);
          return;
      }

      // Perform the fetch
      const response = await fetch(url, {
          method,
          headers: {
              'Content-Type': 'application/json',
          },
          body,
      });

      if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      alert(result.message || `Sensor ${action}d successfully.`);
      fetchDeviceList(); // Refresh the device list
  } catch (error) {
      console.error(`Failed to ${action} sensor:`, error);
      alert(`Failed to ${action} sensor. Check the console for more details.`);
  }
}
























// Function to set up add button functionality
function setupAddButton() {
  const addButton = document.getElementById('add-button');
  if (!addButton) {
      console.error('Add button not found.');
      return;
  }

  addButton.addEventListener('click', manageSensor('add'));
}

// Function to set up rename button functionality
function setupRenameButton() {
  const renameButton = document.getElementById('rename-button');
  if (!renameButton) {
      console.error('Rename button not found.');
      return;
  }

  renameButton.addEventListener('click', manageSensor('rename'));
}

// Function to set up delete button functionality
function setupRemoveButton() {
  const removeButton = document.getElementById('remove-button');
  if (!removeButton) {
      console.error('Delete button not found.');
      return;
  }

  removeButton.addEventListener('click', manageSensor('remove'));
}


async function addSensor() {
  try {
    // const response = await fetch('/devices');

    // if (!response.ok) {
    //     throw new Error(`Error fetching devices: ${response.statusText}`);
    // }

    // const devices = await response.json();
    // displayDeviceList(devices);
    console.log("add pressed")
  } catch (error) {
      console.error('Error:', error);
  }
}

async function renameSensor() {
  try {
    // const response = await fetch('/devices');

    // if (!response.ok) {
    //     throw new Error(`Error fetching devices: ${response.statusText}`);
    // }

    // const devices = await response.json();
    // displayDeviceList(devices);
    console.log("rename pressed")
  } catch (error) {
      console.error('Error:', error);
  }
}

async function removeSensor() {
  try {
    // const response = await fetch('/devices');

    // if (!response.ok) {
    //     throw new Error(`Error fetching devices: ${response.statusText}`);
    // }

    // const devices = await response.json();
    // displayDeviceList(devices);
    console.log("remove pressed")
  } catch (error) {
      console.error('Error:', error);
  }
}



/******************** Device List ********************/

// Function to fetch device list from the server
async function fetchDeviceList() {
  try {
      const response = await fetch('/devices');

      if (!response.ok) {
          throw new Error(`Error fetching devices: ${response.statusText}`);
      }

      const devices = await response.json();
      displayDeviceList(devices);
      console.log(devices)
  } catch (error) {
      console.error('Error:', error);
  }
}


// Function to display the device list
function displayDeviceList(devices) {
  const deviceListContainer = document.getElementById('device-list-container');
  
  if (!deviceListContainer) {
    console.error('No container found for device list.');
    return;
  }

  deviceListContainer.innerHTML = `
    <table id="device-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Location</th>
          <th>MAC Address</th>
          <th>Last Active</th>
        </tr>
      </thead>
      <tbody id="device-list-body">
      </tbody>
    </table>
  `;

  const deviceListBody = document.getElementById('device-list-body');

  devices.forEach(item => {
    const tableRow = document.createElement("tr");
    tableRow.innerHTML = `
        <td>${item.id}</td>
        <td>${item.device_name}</td>
        <td>${item.location}</td>
        <td>${item.mac_address}</td>
        <td>${item.last_active}</td>
    `;
    deviceListBody.appendChild(tableRow);
  });
}


// Function to set up refresh button functionality
function setupRefreshButton() {
  const refreshButton = document.getElementById('refresh-button');
  if (!refreshButton) {
      console.error('Refresh button not found.');
      return;
  }

  refreshButton.addEventListener('click', fetchDeviceList);
}


/******************** Chart data ********************/

// 
async function fetchSensorReadings(device_id) {
  try {
      const response = await fetch(`/sensor-readings?device_id=${device_id}`); 

      if (!response.ok) {
          throw new Error(`Error fetching devices: ${response.statusText}`);
      }

      const readings = await response.json();
      // display readings HERE!
      console.log(readings);
  } catch (error) {
      console.error('Error:', error);
  }
}




/******************** Init Function ********************/

// Initialize the application
function initApp() {
  // setupAddButton();
  // setupRenameButton();
  // setupRemoveButton();
  document.getElementById('add-button').addEventListener('click', () => manageSensor('add'));
  document.getElementById('rename-button').addEventListener('click', () => manageSensor('rename'));
  document.getElementById('remove-button').addEventListener('click', () => manageSensor('remove'));
  setupRefreshButton();
  fetchDeviceList(); // Fetch the initial device list when the page loads
}


// Wait for the DOM to fully load before initializing
document.addEventListener('DOMContentLoaded', initApp);


// svakih 10min je 1000 zapisa





// document.addEventListener('DOMContentLoaded', function() {
//   const tbody = document.getElementById('device-list-body');

//   tbody.addEventListener('click', function(event) {
//       // Check if a table cell was clicked
//       if (event.target.tagName === 'TD') {
//           // Remove highlight from all rows in this tbody
//           const rows = tbody.querySelectorAll('tr');
//           rows.forEach(row => row.classList.remove('clickedrow'));

//           // Add highlight to the clicked row
//           event.target.closest('tr').classList.add('clickedrow');
//       }
//   });
// });