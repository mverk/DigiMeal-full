const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = 3000;

// Data to store the ordered meals (initially empty)
let orderedMeals = [];
let orderId = 0; // Unique id for each order

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set the public folder as the static folder to serve HTML, CSS, and JavaScript files
app.use(express.static(path.join(__dirname, 'public')));

// Handle POST request to '/selected-meal'
app.post('/selected-meal', (req, res) => {
  const selectedMeal = req.body.meal;
  const customMeal = req.body.customMeal; // Get the custom meal input
  const tableNumber = req.body.tableNumber;

  // Determine the meal to use (selected or custom)
  const mealName = customMeal ? customMeal : selectedMeal;

  // Store the selected or custom meal in the orderedMeals array with "Awaiting preparation" status
  orderedMeals.push({ id: orderId++, name: mealName, status: 'Awaiting preparation', tableNumber });

  // Respond with the selected meal as a JSON object
  res.json({ id: orderId - 1 });
});

// Handle POST request to '/update-status'
app.post('/update-status', (req, res) => {
  const orderIdToUpdate = parseInt(req.body.id);
  const status = req.body.status;

  // Find the ordered meal in the array and update its status
  for (const meal of orderedMeals) {
    if (meal.id === orderIdToUpdate) {
      // Update the status of the meal
      meal.status = status;
      break;
    }
  }

  // Respond with a success message
  res.json({ success: true });
});

// Handle POST request to '/confirm-order'
app.post('/confirm-order', (req, res) => {
  const orderIdToConfirm = parseInt(req.body.id);

  // Remove the confirmed order from the array
  orderedMeals = orderedMeals.filter(meal => meal.id !== orderIdToConfirm);

  // Respond with a success message
  res.json({ success: true });
});

// Endpoint to fetch the ordered meals
app.get('/ordered-meals', (req, res) => {
  // Send the orderedMeals array as a JSON response
  res.json(orderedMeals);
});

// Create a WebSocket server and attach it to the HTTP server
const wss = new WebSocket.Server({ server: app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
})});

// WebSocket connection handling
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Broadcast the message to all connected clients (in this case, the receiver and client)
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});
