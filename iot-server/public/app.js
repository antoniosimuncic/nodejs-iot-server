/************************ Manage Sensor ************************/

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
      } else if (action === 'clear') {
        document.getElementById('mac_address').value = '';
        document.getElementById('device_name').value = '';
        document.getElementById('location').value = '';
        return;
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




/************************ Device List ************************/

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
   
  fetchAndHighlightClickedRow();
}


function fetchAndHighlightClickedRow() {
  const tableBody = document.getElementById('device-list-body');

  if (!tableBody) {
      console.error('Device list table body not found.');
      return;
  }

  tableBody.addEventListener('click', (event) => {
      const clickedRow = event.target.closest('tr'); // Get the closest <tr> to the clicked element

      if (!clickedRow) {
          return; // If no <tr> is clicked, do nothing
      }

      // Remove the 'active-row' class from all rows
      const rows = tableBody.querySelectorAll('tr');
      rows.forEach((row) => row.classList.remove('active-row'));

      // Add the 'active-row' class to the clicked row
      clickedRow.classList.add('active-row');

      const activeRow = clickedRow.querySelectorAll('.active-row td');
      // console.log(activeRow);
      const device_name = activeRow[1].innerText;
      const location = activeRow[2].innerText;
      const mac_address = activeRow[3].innerText;

      // Display selected device in the input boxes
      document.getElementById('mac_address').value = mac_address;
      document.getElementById('device_name').value = device_name;
      document.getElementById('location').value = location;

      clickedRowId = parseInt(clickedRow.querySelector('.active-row td').innerText, 10);
      //console.log(clickedRowId);
      selectedRowIndex = clickedRowId;

      fetchSensorReadings(selectedRowIndex);
  });
}




/************************ Chart data ************************/

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
      drawCharts(readings);
      return readings;
  } catch (error) {
      console.error('Error:', error);
  }
}

// Function to draw charts
function drawChartsdas(data) {
  const chartsContainer = document.querySelector('.charts');

  const timestamp = data.map(entry => entry.timestamp);
  const temperature = data.map(entry => entry.temperature);
  const humidity = data.map(entry => entry.humidity);
  const co2 = data.map(entry => entry.co2);
  const pressure = data.map(entry => entry.pressure);
  const voc = data.map(entry => entry.voc);
  const pm1 = data.map(entry => entry.pm1);
  const pm2_5 = data.map(entry => entry.pm2_5);
  const pm4 = data.map(entry => entry.pm4);
  const pm10 = data.map(entry => entry.pm10);


  if (!chartsContainer) {
      console.error('Charts container not found.');
      return;
  }

  // Clear any existing charts
  chartsContainer.innerHTML = '';

  // Keys to be displayed as charts
  const chartKeys = ['temperature', 'humidity', 'co2','pressure', 'voc', 'pm1', 'pm2_5', 'pm4', 'pm10'];

  // Loop through each key and create a chart
  chartKeys.forEach((key) => {
      // Create a container for the chart
      const chartContainer = document.createElement('div');
      chartContainer.classList.add('chart-container');

      // Create a canvas for Chart.js
      const canvas = document.createElement('canvas');
      canvas.id = `${key}-chart`;
      chartContainer.appendChild(canvas);
      chartsContainer.appendChild(chartContainer);

      // Create the chart
      new Chart(canvas, {
          type: 'bar', // Choose your chart type (bar, line, pie, etc.)
          data: {
              labels: [key], // X-axis labels
              datasets: [
                {
                  label: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize key for the label
                  data: [data[key]], // Chart data
                  backgroundColor: 'rgba(0, 123, 255, 0.6)', // Bar color
                  borderColor: 'rgba(0, 123, 255, 1)', // Border color
                  borderWidth: 1,
                }
              ],
          },
          options: {
              responsive: true,
              plugins: {
                  legend: {
                      display: true,
                      position: 'top',
                  },
              },
              scales: {
                  x: {
                      beginAtZero: true,
                  },
                  y: {
                      beginAtZero: true,
                  },
              },
          },
      });
  });
}





function drawChartsda(data) {
  // Extract timestamps, temperatures, and humidities
  const timestamps = data.map(entry => entry.timestamp);
  const temperatures = data.map(entry => entry.temperature);
  const humidities = data.map(entry => entry.humidity);

  // Create the line chart
  const ctx = document.getElementById('lineChart').getContext('2d');
  const lineChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: timestamps.reverse(), // Reverse for chronological order
        datasets: [
            {
                label: 'Temperature (°C)',
                data: temperatures.reverse(),
                borderColor: 'rgba(255,99,132,1)',
                backgroundColor: 'rgba(255,99,132,0.2)',
                fill: true
            },
            {
                label: 'Humidity (%)',
                data: humidities.reverse(),
                borderColor: 'rgba(54,162,235,1)',
                backgroundColor: 'rgba(54,162,235,0.2)',
                fill: true
            }
        ]
    },
    options: {
      responsive: true,
      scales: {
          x: {
              title: {
                  display: true,
                  text: 'Timestamp'
              }
          },
          y: {
              title: {
                  display: true,
                  text: 'Values'
              }
          }
      }
    }
  });
}

// NOVIIII
function drawCharts(data) {
  const chartsContainer = document.querySelector('.charts');

  if (!chartsContainer) {
    console.error('Charts container not found.');
    return;
  }

  chartsContainer.innerHTML = '';

  // List of keys to be visualized (exclude `id`, `device_id`, and other irrelevant keys)
  const chartKeys = ['temperature', 'humidity', 'co2', 'pressure', 'voc'];

  const reversedData = [...data].reverse();


  const timestamps = reversedData.map(row => row.timestamp);

  chartKeys.forEach((key) => {
    const values = reversedData.map(row => row[key]);

    const chartContainer = document.createElement('div');
    chartContainer.classList.add('chart-container');

    const canvas = document.createElement('canvas');
    canvas.id = `${key}-chart`;
    chartContainer.appendChild(canvas);
    chartsContainer.appendChild(chartContainer);

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [{
          label: key.charAt(0).toUpperCase() + key.slice(1),
          data: values,
          borderColor: '#007acc',
          backgroundColor: '#2d2d30',
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Timestamp',
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
            },
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: key.charAt(0).toUpperCase() + key.slice(1),
            },
          },
        },
      }
    });
  });


  const chartContainer = document.createElement('div');
  chartContainer.classList.add('chart-container');
  const canvas = document.createElement('canvas');
  canvas.id = `pm-chart`;
  chartContainer.appendChild(canvas);
  chartsContainer.appendChild(chartContainer);

  const pm1 = data.map(entry => entry.pm1);
  const pm2_5 = data.map(entry => entry.pm2_5);
  const pm4 = data.map(entry => entry.pm4);
  const pm10 = data.map(entry => entry.pm10);

  new Chart(canvas, {
    type: 'line',
      data: {
        labels: timestamps,
        datasets: [
        {
          label: 'PM1',
          data: pm1.reverse(),
          borderColor: 'rgb(255, 118, 148)',
          backgroundColor: '#2d2d30',
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: 'PM2.5',
          data: pm2_5.reverse(),
          borderColor: 'rgb(249, 233, 17)',
          backgroundColor: '#2d2d30',
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: 'PM4',
          data: pm4.reverse(),
          borderColor: 'rgb(10, 196, 7)',
          backgroundColor: '#2d2d30',
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: 'PM10',
          data: pm10.reverse(),
          borderColor: 'rgba(54,162,235,1)',
          backgroundColor: '#2d2d30',
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
        }
      ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Timestamp',
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
            },
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Particle Matter',
            },
          },
        },
      }
  });

}


/******************** Init Function ********************/
let selectedRowIndex = null;

// Initialize the application
function initApp() {
  // Button Event Listeners
  document.getElementById('add-button').addEventListener('click', () => manageSensor('add'));
  document.getElementById('rename-button').addEventListener('click', () => manageSensor('rename'));
  document.getElementById('remove-button').addEventListener('click', () => manageSensor('remove'));
  document.getElementById('clear-button').addEventListener('click', () => manageSensor('clear'));
  document.getElementById('refresh-button').addEventListener('click', () => fetchDeviceList());



  // Initial data fetch when page loads
  fetchDeviceList();
}

// Wait for the DOM to fully load before initializing
document.addEventListener('DOMContentLoaded', initApp);


// svakih 10min očitanje je 1000 zapisa tjedno
