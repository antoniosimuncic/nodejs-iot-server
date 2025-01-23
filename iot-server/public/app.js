

// Function to fetch device list from the server
async function fetchDeviceList() {
  try {
      const response = await fetch('/devices'); // Assuming the server endpoint is /devices

      if (!response.ok) {
          throw new Error(`Error fetching devices: ${response.statusText}`);
      }

      const devices = await response.json();
      displayDeviceList(devices);
  } catch (error) {
      console.error('Error:', error);
  }
}

// Function to display the device list on the webpage
function displayDeviceList(devices) {
  const deviceListContainer = document.getElementById('device-list-container');
  
  if (!deviceListContainer) {
    console.error('No container found for device list.');
    return;
  }

  // Clear any existing content (except the container structure)
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

  // Get the tbody element
  const deviceListBody = document.getElementById('device-list-body');

  // Populate the device list
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


// Initialize the application
function initApp() {
  setupRefreshButton();
  fetchDeviceList(); // Fetch the initial device list when the page loads
}


// Wait for the DOM to fully load before initializing
document.addEventListener('DOMContentLoaded', initApp);








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